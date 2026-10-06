from __future__ import annotations

import os
import re
import hashlib
import shutil
import uuid
from functools import lru_cache
from pathlib import Path
from typing import Any

import pymupdf
import psycopg
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
import mimetypes

from auth import create_token, decode_token, hash_password, is_valid_email, verify_password
from chunking import chunk_text
from database import (create_user, find_user_by_email, get_paper, get_user, hybrid_search,
                      create_chat_session, get_user_chat, initialise, list_admin_logins, list_admin_users, list_papers, list_user_chats,
                      list_paper_annotations, list_user_data, list_user_notifications, get_user_settings,
                      mark_user_notifications_read, update_user_settings, record_activity, record_login, save_artifact,
                      save_paper_annotation, delete_paper_annotation,
                      save_chat_message, save_chunks, save_paper_if_unique, sync_admin_emails,
                      find_duplicate_paper)
from rag import answer, citations_for, embed, embed_query, expand_mindmap_node, generate_study_artifact
from document_processor import extract_text

BASE_DIR = Path(__file__).resolve().parent
PAPERS_DIR = Path(os.getenv("PAPER_STORAGE_DIR", str(BASE_DIR / "data" / "papers"))).resolve()
MAX_UPLOAD_BYTES = 100 * 1024 * 1024
ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".pptx",
    ".txt",
    ".png",
    ".jpg",
    ".jpeg",
}
AUTH = HTTPBearer(auto_error=False)
ARTIFACT_TYPES = {"flashcards", "mindmap", "quiz", "summary", "report", "ppt_outline", "viva", "literature_review", "visualization", "comparison", "research_gap", "research_ideas"}

app = FastAPI(title="ScholarMind Backend", version="1.1.0")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=256)
    role: str = Field(default="student", pattern="^(student|researcher|professor|industry)$")


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=1, max_length=256)


class ChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=4000)
    paper_ids: list[str] | None = None
    session_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=10)


class GenerateRequest(BaseModel):
    kind: str = Field(pattern="^(flashcards|mindmap|quiz|summary|report|ppt_outline|viva|literature_review|visualization|comparison|research_gap|research_ideas)$")
    paper_id: str | None = None
    paper_ids: list[str] | None = Field(default=None, max_length=10)
    prompt: str = Field(default="", max_length=1000)
    count: int = Field(default=6, ge=1, le=20)
    difficulty: str = Field(default="medium", pattern="^(simple|medium|hard)$")


class MindMapExistingNode(BaseModel):
    id: str = Field(min_length=1, max_length=120)
    label: str = Field(min_length=1, max_length=180)


class MindMapExpansionRequest(BaseModel):
    paper_id: str
    node_id: str = Field(min_length=1, max_length=120)
    node_label: str = Field(min_length=2, max_length=180)
    breadcrumb: list[str] = Field(default_factory=list, max_length=12)
    context: str = Field(default="", max_length=1600)
    existing_nodes: list[MindMapExistingNode] = Field(default_factory=list, max_length=250)


class MindMapExpansionNode(BaseModel):
    id: str = Field(min_length=1, max_length=120)
    label: str = Field(min_length=2, max_length=100)
    summary: str = Field(min_length=20, max_length=500)
    details: str = Field(min_length=30, max_length=1200)
    example: str = Field(default="", max_length=500)
    key_points: list[str] = Field(default_factory=list, max_length=4)
    related_concepts: list[str] = Field(default_factory=list, max_length=4)
    importance: bool = False
    page: int = Field(ge=1)
    evidence: str = Field(min_length=20, max_length=180)


class MindMapExpansionEdge(BaseModel):
    source: str = Field(min_length=1, max_length=120)
    target: str = Field(min_length=1, max_length=120)
    label: str = Field(min_length=2, max_length=80)


class MindMapExpansionResponse(BaseModel):
    parent_id: str
    children: list[MindMapExpansionNode]
    edges: list[MindMapExpansionEdge]
    generation_mode: str = "ai"


class ArtifactUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    payload: dict[str, Any] | None = None


class PaperAnnotationRequest(BaseModel):
    page_number: int = Field(ge=1)
    kind: str = Field(pattern="^(highlight|note)$")
    content: str = Field(min_length=1, max_length=5000)


class SettingsUpdate(BaseModel):
    profile: dict[str, str] | None = None
    notifications: dict[str, bool] | None = None
    theme: str | None = Field(default=None, pattern="^(light|dark|system)$")


@app.on_event("startup")
def startup() -> None:
    PAPERS_DIR.mkdir(parents=True, exist_ok=True)
    initialise()
    sync_admin_emails()


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(AUTH)) -> dict[str, Any]:
    if not credentials:
        raise HTTPException(status_code=401, detail="Sign in to continue")
    try:
        claims = decode_token(credentials.credentials)
        user = get_user(claims["sub"])
    except (ValueError, RuntimeError):
        user = None
    if not user:
        raise HTTPException(status_code=401, detail="Your session has expired. Sign in again.")
    return user


def admin_user(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Administrator access is required")
    return user


def owned_paper(paper_id: str, user: dict[str, Any]) -> dict[str, Any]:
    paper = get_paper(paper_id)
    if not paper or paper.get("owner_id") != user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper


@lru_cache(maxsize=128)
def pdf_index(file_path: str) -> dict[str, Any]:
    """Return real PDF bookmarks and a page index with headings detected from page text."""
    with pymupdf.open(file_path) as document:
        page_count = len(document)
        detected: list[list[str]] = [[] for _ in range(page_count)]
        heading_pattern = re.compile(r"^\d+(?:\.\d+)*\.?\s+[A-Z][\w ,:;()&/'’–-]{1,100}$")
        named_pattern = re.compile(
            r"^(abstract|introduction|background|related work|method(?:s|ology)?|"
            r"experiments?|results?(?: and discussion)?|discussion|conclusion|"
            r"references|acknowledg(?:e)?ments|appendix(?:\s+[A-Z])?)$", re.IGNORECASE
        )

        for page_number, page in enumerate(document, start=1):
            page_index = page_number - 1
            for block in page.get_text("dict").get("blocks", []):
                for line in block.get("lines", []):
                    spans = line.get("spans", [])
                    title = re.sub(r"\s+", " ", "".join(span.get("text", "") for span in spans)).strip()
                    if not title or len(title) > 110:
                        continue
                    bold = any(span.get("flags", 0) & 16 for span in spans)
                    size = max((span.get("size", 0) for span in spans), default=0)
                    is_heading = bool(heading_pattern.match(title) or named_pattern.match(title))
                    is_styled_heading = bold and size >= 12 and len(title.split()) <= 12 and not title.endswith((".", ";", ","))
                    if (is_heading or is_styled_heading) and title not in detected[page_index]:
                        detected[page_index].append(title)

        toc = document.get_toc()
        contents = [
            {"title": title.strip(), "page": page_number, "level": max(level - 1, 0)}
            for level, title, page_number, *_ in toc
            if title.strip() and 1 <= page_number <= page_count
        ]
        if not contents:
            contents = [
                {"title": title, "page": page_number, "level": 0}
                for page_number, titles in enumerate(detected, start=1)
                for title in titles
            ]

        pages = [
            {"page": page_number, "title": titles[0] if titles else f"Page {page_number}"}
            for page_number, titles in enumerate(detected, start=1)
        ]
        return {"contents": contents, "pages": pages}


def sha256_file(file_path: Path) -> str:
    digest = hashlib.sha256()
    with file_path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def duplicate_upload_result(paper: dict[str, Any]) -> dict[str, Any]:
    return {"paper_id": paper["id"], "filename": paper["filename"],
            "total_pages": paper["page_count"],"file_type": paper.get("file_type"), "status": "duplicate",
            "duplicate_of": paper["id"]}


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "ScholarMind backend is running"}


@app.get("/")
def root():
    return {
        "message": "ScholarMind backend is running",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)


@app.post("/api/auth/register", status_code=201)
def register(payload: RegisterRequest):
    email = payload.email.strip().lower()
    if not is_valid_email(email):
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    if find_user_by_email(email):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    admins = {value.strip().lower() for value in os.getenv("ADMIN_EMAILS", "").split(",") if value.strip()}
    role = "admin" if email in admins else payload.role
    try:
        user = create_user(str(uuid.uuid4()), payload.name.strip(), email, hash_password(payload.password), role)
    except psycopg.errors.UniqueViolation as exc:
        raise HTTPException(status_code=409, detail="An account with this email already exists") from exc
    return {"access_token": create_token(user), "token_type": "bearer", "user": user}


@app.post("/api/auth/login")
def login(payload: LoginRequest, request: Request):
    email = payload.email.strip().lower()
    user = find_user_by_email(email)
    succeeded = bool(user and verify_password(payload.password, user["password_hash"]))
    record_login(email, succeeded, user["id"] if succeeded else None,
                 request.client.host if request.client else None, request.headers.get("user-agent"))
    if not succeeded:
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    public_user = {key: user[key] for key in ("id", "name", "email", "role", "created_at", "last_login_at")}
    return {"access_token": create_token(user), "token_type": "bearer", "user": public_user}


@app.get("/api/auth/me")
def me(user: dict[str, Any] = Depends(current_user)):
    return {"user": user}


@app.get("/api/me/data")
def my_data(user: dict[str, Any] = Depends(current_user)):
    return list_user_data(user["id"])


@app.get("/api/settings")
def settings(user: dict[str, Any] = Depends(current_user)):
    return get_user_settings(user["id"])


@app.patch("/api/settings")
def save_settings(payload: SettingsUpdate, user: dict[str, Any] = Depends(current_user)):
    allowed_profile = {"name", "institution", "bio", "field", "keywords", "scholar", "github", "linkedin"}
    allowed_notifications = {"papers", "ideas", "viva", "newsletter", "marketing"}
    profile = payload.profile or {}
    notifications = payload.notifications or {}
    if set(profile) - allowed_profile:
        raise HTTPException(status_code=422, detail="The profile contains unsupported fields")
    if set(notifications) - allowed_notifications:
        raise HTTPException(status_code=422, detail="The notification preferences contain unsupported fields")
    profile = {key: value.strip() for key, value in profile.items()}
    limits = {"name": 120, "institution": 200, "bio": 1000, "field": 120,
              "keywords": 500, "scholar": 500, "github": 500, "linkedin": 500}
    for key, value in profile.items():
        if len(value) > limits[key]:
            raise HTTPException(status_code=422, detail=f"{key.title()} is too long")
    if "name" in profile and len(profile["name"]) < 2:
        raise HTTPException(status_code=422, detail="Name must contain at least 2 characters")
    return update_user_settings(user["id"], profile=profile, notifications=notifications, theme=payload.theme)


@app.get("/api/notifications")
def notifications(user: dict[str, Any] = Depends(current_user)):
    items = list_user_notifications(user["id"])
    return {"notifications": items, "unread_count": sum(not item["read"] for item in items)}


@app.post("/api/notifications/read")
def read_notifications(user: dict[str, Any] = Depends(current_user)):
    mark_user_notifications_read(user["id"])
    return {"ok": True}


@app.get("/api/chats")
def chats(user: dict[str, Any] = Depends(current_user)):
    return {"chats": list_user_chats(user["id"])}


@app.get("/api/chats/{chat_id}")
def chat_detail(chat_id: str, user: dict[str, Any] = Depends(current_user)):
    result = get_user_chat(user["id"], chat_id)
    if not result:
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"chat": result}


@app.get("/api/admin/overview")
def admin_overview(user: dict[str, Any] = Depends(admin_user)):
    return {"users": list_admin_users(), "login_activity": list_admin_logins()}


@app.get("/api/papers")
def papers(user: dict[str, Any] = Depends(current_user)):
    return {"papers": [paper for paper in list_papers() if paper.get("owner_id") == user["id"]]}


@app.get("/api/papers/{paper_id}")
def paper(paper_id: str, user: dict[str, Any] = Depends(current_user)):
    result = owned_paper(paper_id, user)
    return {key: value for key, value in result.items() if key != "stored_path"}


@app.get("/api/papers/{paper_id}/index")
def paper_index(paper_id: str, user: dict[str, Any] = Depends(current_user)):
    result = owned_paper(paper_id, user)
    if not Path(result["stored_path"]).is_file():
        raise HTTPException(status_code=404, detail="Paper file not found")
    try:
        if result["file_type"] != ".pdf":
            return {
             "contents": [],
            "pages": [],
            "message": "Indexing currently supported only for PDF files."
    }
        return pdf_index(result["stored_path"])
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not read PDF contents: {exc}") from exc


@app.get("/api/papers/{paper_id}/annotations")
def paper_annotations(paper_id: str, user: dict[str, Any] = Depends(current_user)):
    owned_paper(paper_id, user)
    return {"annotations": list_paper_annotations(paper_id, user["id"])}


@app.post("/api/papers/{paper_id}/annotations", status_code=201)
def create_paper_annotation(paper_id: str, payload: PaperAnnotationRequest,
                            user: dict[str, Any] = Depends(current_user)):
    paper = owned_paper(paper_id, user)
    if payload.page_number > paper["page_count"]:
        raise HTTPException(status_code=422, detail="Page number is outside this PDF")
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=422, detail="Enter a quote or note before saving")
    annotation = save_paper_annotation(str(uuid.uuid4()), paper_id, user["id"],
                                       payload.page_number, payload.kind, content)
    return {"annotation": annotation}


@app.delete("/api/papers/{paper_id}/annotations/{annotation_id}", status_code=204)
def remove_paper_annotation(paper_id: str, annotation_id: str,
                            user: dict[str, Any] = Depends(current_user)):
    owned_paper(paper_id, user)
    if not delete_paper_annotation(annotation_id, paper_id, user["id"]):
        raise HTTPException(status_code=404, detail="Annotation not found")
    return Response(status_code=204)


@app.get("/api/papers/{paper_id}/file")
def paper_file(paper_id: str, user: dict[str, Any] = Depends(current_user)):
    result = owned_paper(paper_id, user)

    if not Path(result["stored_path"]).is_file():
        raise HTTPException(status_code=404, detail="File not found")

    media_type, _ = mimetypes.guess_type(
        result["filename"]
    )

    return FileResponse(
        result["stored_path"],
        media_type=media_type or "application/octet-stream",
        filename=result["filename"]
    )


@app.post("/api/papers/upload", status_code=201)
def upload_paper(
    file: UploadFile = File(...),
    user: dict[str, Any] = Depends(current_user),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file was selected",
        )

    original_name = Path(file.filename).name
    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=(
                "Unsupported file type. Allowed formats: "
                "PDF, DOCX, PPTX, TXT, PNG, JPG, JPEG."
            ),
        )

    paper_id = str(uuid.uuid4())

    safe_name = original_name

    file_path = PAPERS_DIR / f"{paper_id}{extension}"

    with file_path.open("wb") as destination:
        shutil.copyfileobj(file.file, destination)

    if file_path.stat().st_size > MAX_UPLOAD_BYTES:
        file_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=413,
            detail="File must be 100 MB or smaller",
        )

    try:
        # ---------------------------------------------------------
        # 1. Calculate file hash
        # ---------------------------------------------------------
        content_sha256 = sha256_file(file_path)

        # ---------------------------------------------------------
        # 2. Check duplicate
        # ---------------------------------------------------------
        duplicate = find_duplicate_paper(
            user["id"],
            content_sha256,
        )

        if duplicate:
            file_path.unlink(missing_ok=True)

            record_activity(
                user["id"],
                "duplicate_upload_skipped",
                {
                    "paper_id": duplicate["id"],
                    "filename": safe_name,
                },
            )

            return duplicate_upload_result(duplicate)

        # ---------------------------------------------------------
        # 3. Extract text
        # ---------------------------------------------------------
        extracted = extract_text(file_path)

        full_text = extracted["text"]
        pages = extracted["pages"]
        page_count = extracted["page_count"]

        if not full_text.strip():
            raise ValueError(
                "No readable text was found in this file."
            )

        # ---------------------------------------------------------
        # 4. Create chunks
        # ---------------------------------------------------------
        chunks = []
        next_number = 1

        for page in pages:
            page_chunks = chunk_text(
                page["text"],
                paper_id,
                page["page_number"],
                start_number=next_number,
            )

            chunks.extend(page_chunks)
            next_number += len(page_chunks)

        if not chunks:
            raise ValueError(
                "No text chunks could be created from this file."
            )

        # ---------------------------------------------------------
        # 5. Generate embeddings
        # ---------------------------------------------------------
        embeddings = embed(
            [chunk["text"] for chunk in chunks]
        )

        # ---------------------------------------------------------
        # 6. Save paper metadata
        # ---------------------------------------------------------
        saved = save_paper_if_unique(
            paper_id,
            safe_name,
            str(file_path),
            page_count,
            user["id"],
            content_sha256,
            extension,
        )

        if not saved["created"]:
            file_path.unlink(missing_ok=True)

            record_activity(
                user["id"],
                "duplicate_upload_skipped",
                {
                    "paper_id": saved["paper"]["id"],
                    "filename": safe_name,
                },
            )

            return duplicate_upload_result(
                saved["paper"]
            )

        # ---------------------------------------------------------
        # 7. Save chunks + embeddings
        # ---------------------------------------------------------
        save_chunks(
            chunks,
            embeddings,
        )

        record_activity(
            user["id"],
            "paper_uploaded",
            {
                "paper_id": paper_id,
                "filename": safe_name,
                "file_type": extension,
            },
        )

    except ValueError as exc:
        file_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        file_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=422,
            detail=f"Could not process file: {exc}",
        ) from exc

    return {
        "paper_id": paper_id,
        "filename": safe_name,
        "file_type": extension,
        "total_pages": page_count,
        "total_chunks": len(chunks),
        "status": "ready",
    }

@app.post("/api/chat")
def chat(request: ChatRequest, user: dict[str, Any] = Depends(current_user)):
    if request.paper_ids:
        for paper_id in request.paper_ids:
            owned_paper(paper_id, user)
    hits = hybrid_search(request.question, embed_query(request.question), request.paper_ids, request.top_k, owner_id=user["id"])
    citations = citations_for(hits)
    session = None
    history: list[dict[str, str]] = []
    if request.session_id:
        # Only recent turns are sent back to the model. Fetching the full transcript
        # on every turn gets slower as a chat grows.
        session = get_user_chat(user["id"], request.session_id, message_limit=8)
        if not session:
            raise HTTPException(status_code=404, detail="Chat not found")
        history = [{"role": message["role"], "content": message["content"]}
                   for message in session["messages"][-8:]
                   if message["role"] in {"user", "assistant"}]
    else:
        session = create_chat_session(user["id"], request.question.strip()[:120], request.paper_ids[0] if request.paper_ids else None)
    save_chat_message(session["id"], "user", request.question)
    response = {"answer": answer(request.question, hits, history), "citations": citations,
                "sources": [{"type": "page", "label": f"{item['paperTitle']} p.{item['page']}", "page": item["page"]} for item in citations],
                "mode": "llm" if os.getenv("LLM_API_KEY") else "retrieval-only"}
    save_chat_message(session["id"], "assistant", response["answer"], citations, response["sources"])
    response["session_id"] = session["id"]
    record_activity(user["id"], "asked_question", {"paper_ids": request.paper_ids or []})
    return response


@app.post("/api/learning/generate", status_code=201)
def generate_learning(payload: GenerateRequest, user: dict[str, Any] = Depends(current_user)):
    paper_ids = list(dict.fromkeys(payload.paper_ids or ([payload.paper_id] if payload.paper_id else [])))
    if not paper_ids:
        raise HTTPException(status_code=422, detail="Select at least one uploaded paper")
    papers = [owned_paper(paper_id, user) for paper_id in paper_ids]
    paper_names = ", ".join(paper["filename"] for paper in papers)
    focus = payload.prompt.strip()
    retrieval_topics = {
            "quiz": "important concepts definitions methods results findings conclusions limitations",
            "flashcards": "key concepts definitions terminology methods findings takeaways",
            "mindmap": "central topic key concepts themes methods results relationships",
            "comparison": "research objectives methodology datasets experiments results limitations contributions",
            "literature_review": "research themes methods findings results limitations trends",
            "research_gap": "limitations unresolved questions future work missing evidence contradictory findings",
            "research_ideas": "limitations unresolved questions future work methods findings",
    }
    topic_query = retrieval_topics.get(payload.kind)
    if topic_query:
        query = f"{topic_query} {focus} from {paper_names}".strip()
    elif focus:
        query = focus
    else:
        query = f"key findings and main ideas from {paper_names}"
    query_embedding = embed_query(query)
    cross_paper_kinds = {"comparison", "literature_review", "research_gap", "research_ideas"}
    if payload.kind in cross_paper_kinds and len(paper_ids) > 1:
        # Retrieve independently per selected paper so a single document cannot crowd out the others.
        per_paper_limit = max(1, min(4, payload.count // len(paper_ids)))
        hits = []
        for selected_id in paper_ids:
            hits.extend(hybrid_search(query, query_embedding, [selected_id], per_paper_limit, owner_id=user["id"]))
    else:
        retrieval_limit = min(payload.count * 2, 20) if payload.kind == "quiz" else min(payload.count, 10)
        hits = hybrid_search(query, query_embedding, paper_ids, retrieval_limit, owner_id=user["id"])
    if not hits:
        raise HTTPException(status_code=404, detail="No text passages found for this paper")
    try:
        content = generate_study_artifact(payload.kind, query, hits, payload.count, payload.difficulty)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if content.get("_generation_mode") == "source_fallback":
        raise HTTPException(status_code=503, detail=content.get("_generation_notice", "AI generation failed. Please try again."))
    kind_title = payload.kind.replace("_", " ").title()
    artifact_title = (f"{kind_title}: {focus}" if focus else f"{kind_title} from {paper_names}")[:200]
    artifact = save_artifact(user["id"], payload.kind, artifact_title, {**content, "citations": citations_for(hits), "source_paper_ids": paper_ids}, paper_ids[0])
    record_activity(user["id"], f"generated_{payload.kind}", {"artifact_id": artifact["id"], "paper_ids": paper_ids})
    return {"artifact": artifact}


@app.post("/api/learning/mindmap/expand", response_model=MindMapExpansionResponse)
def expand_learning_mindmap(payload: MindMapExpansionRequest, user: dict[str, Any] = Depends(current_user)):
    owned_paper(payload.paper_id, user)
    existing_nodes = [node.model_dump() for node in payload.existing_nodes]
    if not any(node["id"] == payload.node_id for node in existing_nodes):
        raise HTTPException(status_code=422, detail="The selected concept is not part of this mind map")

    retrieval_query = " ".join([
        payload.node_label,
        *payload.breadcrumb[-6:],
        payload.context[:700],
        "definition mechanism key details examples advantages limitations applications relationships",
    ])
    hits = hybrid_search(retrieval_query, embed_query(retrieval_query), [payload.paper_id], 12, owner_id=user["id"])
    if not hits:
        raise HTTPException(status_code=404, detail="No paper passages found for this concept")
    try:
        return expand_mindmap_node(
            payload.node_id, payload.node_label, payload.breadcrumb, payload.context, existing_nodes, hits,
        )
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.patch("/api/artifacts/{artifact_id}")
def update_artifact(artifact_id: str, payload: ArtifactUpdate, user: dict[str, Any] = Depends(current_user)):
    from database import update_user_artifact
    result = update_user_artifact(user["id"], artifact_id, payload.title, payload.payload)
    if not result:
        raise HTTPException(status_code=404, detail="Saved item not found")
    record_activity(user["id"], "updated_saved_item", {"artifact_id": artifact_id})
    return {"artifact": result}


@app.delete("/api/artifacts/{artifact_id}", status_code=204)
def delete_artifact(artifact_id: str, user: dict[str, Any] = Depends(current_user)):
    from database import delete_user_artifact
    if not delete_user_artifact(user["id"], artifact_id):
        raise HTTPException(status_code=404, detail="Saved item not found")
    record_activity(user["id"], "deleted_saved_item", {"artifact_id": artifact_id})
