"""Embedding, context construction, and optional grounded LLM generation."""
from __future__ import annotations

import json
import logging
import os
import urllib.request
from functools import lru_cache
from typing import Any

logger = logging.getLogger(__name__)

@lru_cache(maxsize=1)
def embedding_model() -> Any:
    # Delay importing Torch/Sentence Transformers until a paper actually needs indexing.
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2"))

def embed(texts: list[str]) -> list[list[float]]:
    return embedding_model().encode(texts, normalize_embeddings=True, show_progress_bar=False).tolist()

def citations_for(hits: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [{"number": i, "paper_id": h["paper_id"], "paperTitle": h["filename"],
             "page": h["page_number"], "section": h["section"], "excerpt": h["content"][:700]}
            for i, h in enumerate(hits, start=1)]

def _context(hits: list[dict[str, Any]]) -> str:
    return "\n\n".join(f"[{i}] {h['filename']} | page {h['page_number']} | {h['section']}\n{h['content']}"
                       for i, h in enumerate(hits, start=1))

def _extractive_answer(hits: list[dict[str, Any]]) -> str:
    if not hits:
        return "I could not find relevant content in the uploaded papers. Try a more specific question."
    passages = []
    for i, hit in enumerate(hits[:3], start=1):
        sentence = hit["content"].split(". ")[0].strip()
        passages.append(f"{sentence}. [{i}]")
    return "I found these relevant passages in your uploaded papers:\n\n" + "\n\n".join(passages)

def answer(question: str, hits: list[dict[str, Any]]) -> str:
    """Use an OpenAI-compatible API when configured; otherwise never fabricate a response."""
    api_key = os.getenv("LLM_API_KEY")
    if not api_key:
        return _extractive_answer(hits)
    base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    payload = json.dumps({"model": os.getenv("LLM_MODEL", "gpt-4o-mini"), "temperature": 0.2,
        "messages": [
            {"role": "system", "content": "You are a precise academic assistant. Answer only from supplied sources. Cite every factual claim as [n]."},
            {"role": "user", "content": f"SOURCES:\n{_context(hits)}\n\nQUESTION: {question}"}
        ]}).encode("utf-8")
    request = urllib.request.Request(f"{base_url}/chat/completions", data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            content = json.loads(response.read())["choices"][0]["message"]["content"]
        if isinstance(content, str) and content.strip():
            return content.strip()
    except Exception:
        # Keep document chat usable when the optional LLM service is unavailable.
        logger.warning("LLM chat request failed; using retrieved passages instead", exc_info=True)
    return _extractive_answer(hits)


def generate_study_artifact(kind: str, prompt: str, hits: list[dict[str, Any]], count: int = 8) -> dict[str, Any]:
    """Generate a structured learning/research artifact grounded in retrieved passages."""
    if not hits:
        raise ValueError("No relevant paper passages were found. Try a more specific topic or re-upload the PDF.")
    if kind == "flashcards":
        fallback_data: dict[str, Any] = {"cards": []}
        shape = '{"cards":[{"front":"A focused question testing one concept","back":"A concise, accurate answer supported by the paper","page":1}]}'
    elif kind == "mindmap":
        fallback_data = {"nodes": [], "edges": []}
        shape = '{"nodes":[{"id":"root","label":"Central topic","page":1},{"id":"concept-1","label":"Concise concept","page":2}],"edges":[{"source":"root","target":"concept-1","label":"explains"}]}'
    elif kind == "quiz":
        fallback_data = {"questions": []}
        shape = '{"questions":[{"question":"A clear question testing understanding, not a copied sentence","options":["Plausible answer A","Plausible answer B","Plausible answer C","Plausible answer D"],"answer":0,"explanation":"Why this is correct, grounded in the paper","page":1}]}'
    elif kind in {"summary", "report", "ppt_outline", "viva", "literature_review", "visualization"}:
        field = {"summary": "summary", "report": "sections", "ppt_outline": "slides", "viva": "questions", "literature_review": "sections", "visualization": "visualizations"}[kind]
        fallback_data = {field: [{"title": h["section"], "content": h["content"][:1400], "page": h["page_number"], "speaker_notes": h["content"][:500] if kind == "ppt_outline" else None} for h in hits[:count]]}
        shape = "JSON object with the requested structured content; PPT slides should each include speaker_notes."
    else:
        raise ValueError("Unsupported study artifact type")

    api_key = os.getenv("LLM_API_KEY")
    if not api_key:
        fallback_data["_generation_mode"] = "source_fallback"
        fallback_data["_generation_notice"] = ("AI generation is not configured. No quiz, flashcards, or mind map were fabricated; configure Gemini and generate again."
            if kind in {"quiz", "flashcards", "mindmap"} else "AI generation is not configured. This is extracted source material, not a generated " + kind.replace("_", " ") + ".")
        return fallback_data
    base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    shared = (f"Use only the paper passages below. Focus requested: {prompt}. Generate up to {min(count, 10)} useful items. "
              "Each page must be one of the page numbers shown in the sources. If evidence is insufficient, omit the item. "
              "Do not copy a passage verbatim as a question; paraphrase and test understanding. Return JSON only, with no markdown.")
    task_instructions = {
        "quiz": "Create multiple-choice questions that test distinct, important concepts from this paper. Every question must be answerable from the cited passage. Provide exactly four different, plausible options; exactly one is correct. `answer` is the zero-based index (0-3) of that correct option. Explanation must justify the answer using the paper, not merely repeat the answer.",
        "flashcards": "Create study flashcards, one concept per card. `front` must be a direct, self-contained question. `back` must state the correct answer concisely in your own words, adding a key detail only when supported. Avoid vague prompts and duplicated concepts.",
        "mindmap": "Create a hierarchical concept map. Use one root node for the paper's central topic; add concise concept nodes and meaningful relationship edges. Do not use full sentences or duplicate nodes. Every edge endpoint must match a node id. Cite source page on each non-root node.",
    }
    instruction = f"{shared} {task_instructions.get(kind, 'Create concise, useful study material grounded in the sources.')} Match this structure: {shape}"
    payload = json.dumps({"model": os.getenv("LLM_MODEL", "gpt-4o-mini"), "temperature": 0.2,
        "messages": [
            {"role": "system", "content": "You are a precise academic learning assistant. Use only supplied source passages and return valid JSON."},
            {"role": "user", "content": f"{instruction}\n\nSOURCES:\n{_context(hits)}"}
        ]}).encode("utf-8")
    request = urllib.request.Request(f"{base_url}/chat/completions", data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            content = json.loads(response.read())["choices"][0]["message"]["content"]
        if not isinstance(content, str) or not content.strip():
            logger.warning("LLM study generation returned empty content; using retrieved paper content instead")
            fallback_data["_generation_mode"] = "source_fallback"
            fallback_data["_generation_notice"] = "Gemini returned no usable content. No quiz, flashcards, or mind map were fabricated; check the backend window and generate again."
            return fallback_data
        content = content.strip()
        start, end = content.find("{"), content.rfind("}")
        if start < 0 or end < start:
            logger.warning("LLM study generation returned non-JSON content; using retrieved paper content instead")
            fallback_data["_generation_mode"] = "source_fallback"
            fallback_data["_generation_notice"] = "Gemini returned an unusable response. No quiz, flashcards, or mind map were fabricated; check the backend window and generate again."
            return fallback_data
        result = json.loads(content[start:end + 1])
        _validate_study_artifact(kind, result, hits)
        result["_generation_mode"] = "ai"
        return result
    except Exception:
        # A model/provider response must not prevent source-based study material from being saved.
        logger.warning("LLM study generation failed; using retrieved paper content instead", exc_info=True)
        fallback_data["_generation_mode"] = "source_fallback"
        fallback_data["_generation_notice"] = ("Gemini did not return a valid study set, so no incorrect quiz, flashcards, or mind map were shown. Check the backend window, then generate again."
            if kind in {"quiz", "flashcards", "mindmap"} else "Gemini did not return valid generated content. Check the backend window, then generate again.")
        return fallback_data


def _validate_study_artifact(kind: str, result: Any, hits: list[dict[str, Any]]) -> None:
    """Reject malformed or unsupported model output instead of showing it as correct."""
    if not isinstance(result, dict):
        raise ValueError("Expected a JSON object")
    allowed_pages = {int(hit["page_number"]) for hit in hits}
    if kind == "quiz":
        items = result.get("questions")
        if not isinstance(items, list) or not items:
            raise ValueError("Quiz has no questions")
        for item in items:
            if not isinstance(item, dict) or not isinstance(item.get("question"), str) or len(item["question"].strip()) < 12:
                raise ValueError("Quiz question is missing or too short")
            options = item.get("options")
            if not isinstance(options, list) or len(options) != 4 or any(not isinstance(x, str) or not x.strip() for x in options) or len({x.strip().casefold() for x in options}) != 4:
                raise ValueError("Each quiz question must have four unique answer options")
            if type(item.get("answer")) is not int or not 0 <= item["answer"] < 4:
                raise ValueError("Quiz correct-answer index must be from 0 to 3")
            if not isinstance(item.get("explanation"), str) or len(item["explanation"].strip()) < 12:
                raise ValueError("Quiz explanation is missing")
            if type(item.get("page")) is not int or item["page"] not in allowed_pages:
                raise ValueError("Quiz citation page is not in the supplied passages")
    elif kind == "flashcards":
        items = result.get("cards")
        if not isinstance(items, list) or not items:
            raise ValueError("No flashcards returned")
        for item in items:
            if not isinstance(item, dict) or not all(isinstance(item.get(key), str) and len(item[key].strip()) >= 8 for key in ("front", "back")):
                raise ValueError("Flashcard needs a meaningful question and answer")
            if type(item.get("page")) is not int or item["page"] not in allowed_pages:
                raise ValueError("Flashcard citation page is not in the supplied passages")
    elif kind == "mindmap":
        nodes, edges = result.get("nodes"), result.get("edges")
        if not isinstance(nodes, list) or not nodes or not isinstance(edges, list):
            raise ValueError("Mind map needs nodes and edges")
        ids = {node.get("id") for node in nodes if isinstance(node, dict) and isinstance(node.get("id"), str)}
        if len(ids) != len(nodes) or any(not isinstance(node.get("label"), str) or not node["label"].strip() for node in nodes):
            raise ValueError("Mind map nodes need unique ids and labels")
        if not any(node.get("id") == "root" for node in nodes):
            raise ValueError("Mind map needs a root node")
        if any(not isinstance(edge, dict) or edge.get("source") not in ids or edge.get("target") not in ids or edge.get("source") == edge.get("target") for edge in edges):
            raise ValueError("Mind map edge points to an unknown node")
        if len(nodes) > 1 and not edges:
            raise ValueError("Mind map concepts need relationship edges")
