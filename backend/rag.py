"""Embedding, context construction, and optional grounded LLM generation."""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from functools import lru_cache
from typing import Any

from sentence_transformers import SentenceTransformer

@lru_cache(maxsize=1)
def embedding_model() -> SentenceTransformer:
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


def generate_study_artifact(kind: str, prompt: str, hits: list[dict[str, Any]], count: int = 8) -> dict[str, Any]:
    """Generate a structured learning/research artifact grounded in retrieved passages."""
    fallback = _extractive_answer(hits)
    if kind == "flashcards":
        fallback_data: dict[str, Any] = {"cards": [{"front": h["content"].split(". ")[0][:400], "back": h["content"][:1000], "page": h["page_number"]} for h in hits[:count]]}
        shape = '{"cards":[{"front":"question","back":"answer","page":1}]}'
    elif kind == "mindmap":
        nodes = [{"id": "root", "label": prompt[:100]}]
        edges = []
        for i, h in enumerate(hits[:count], 1):
            nodes.append({"id": f"n{i}", "label": h["content"].split(". ")[0][:100], "page": h["page_number"]})
            edges.append({"source": "root", "target": f"n{i}"})
        fallback_data = {"nodes": nodes, "edges": edges}
        shape = '{"nodes":[{"id":"root","label":"topic"}],"edges":[{"source":"root","target":"node-id"}]}'
    elif kind == "quiz":
        fallback_data = {"questions": [{"question": h["content"].split(". ")[0][:300], "options": ["See cited source passage", "Not stated in the paper"], "answer": 0, "explanation": h["content"][:700], "page": h["page_number"]} for h in hits[:count]]}
        shape = '{"questions":[{"question":"...","options":["..."],"answer":0,"explanation":"...","page":1}]}'
    elif kind in {"summary", "report", "ppt_outline", "viva", "literature_review", "visualization"}:
        field = {"summary": "summary", "report": "sections", "ppt_outline": "slides", "viva": "questions", "literature_review": "sections", "visualization": "visualizations"}[kind]
        fallback_data = {field: [{"title": h["section"], "content": h["content"][:1400], "page": h["page_number"], "speaker_notes": h["content"][:500] if kind == "ppt_outline" else None} for h in hits[:count]]}
        shape = "JSON object with the requested structured content; PPT slides should each include speaker_notes."
    else:
        raise ValueError("Unsupported study artifact type")

    api_key = os.getenv("LLM_API_KEY")
    if not api_key:
        return fallback_data
    base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    instruction = (f"Create {kind} for a student using only the provided sources. User focus: {prompt}. "
                   f"Create at most {count} items. Include page numbers for source-based items. "
                   f"Return valid JSON only, matching this structure: {shape}. Do not invent source facts.")
    payload = json.dumps({"model": os.getenv("LLM_MODEL", "gpt-4o-mini"), "temperature": 0.2,
        "messages": [
            {"role": "system", "content": "You are a precise academic learning assistant. Use only supplied source passages and return valid JSON."},
            {"role": "user", "content": f"{instruction}\n\nSOURCES:\n{_context(hits)}"}
        ]}).encode("utf-8")
    request = urllib.request.Request(f"{base_url}/chat/completions", data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            content = json.loads(response.read())["choices"][0]["message"]["content"].strip()
        start, end = content.find("{"), content.rfind("}")
        result = json.loads(content[start:end + 1])
        if not isinstance(result, dict):
            raise ValueError("Expected a JSON object")
        return result
    except (urllib.error.URLError, urllib.error.HTTPError, KeyError, IndexError, json.JSONDecodeError, ValueError):
        return fallback_data
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
            return json.loads(response.read())["choices"][0]["message"]["content"].strip()
    except (urllib.error.URLError, urllib.error.HTTPError, KeyError, IndexError, json.JSONDecodeError):
        return _extractive_answer(hits)
