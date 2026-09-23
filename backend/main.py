from __future__ import annotations

import os
import shutil
import uuid
from pathlib import Path
from typing import Any

import pymupdf
import psycopg
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from auth import create_token, decode_token, hash_password, is_valid_email, verify_password
from chunking import chunk_text
from database import (create_user, find_user_by_email, get_paper, get_user, hybrid_search,
                      create_chat_session, get_user_chat, initialise, list_admin_logins, list_admin_users, list_papers, list_user_chats,
                      list_user_data, record_activity, record_login, save_artifact,
                      save_chat_message, save_chunks, save_paper, sync_admin_emails)
from rag import answer, citations_for, embed, generate_study_artifact

BASE_DIR = Path(__file__).resolve().parent
PAPERS_DIR = BASE_DIR / "data" / "papers"
MAX_UPLOAD_BYTES = 100 * 1024 * 1024
AUTH = HTTPBearer(auto_error=False)
ARTIFACT_TYPES = {"flashcards", "mindmap", "quiz", "summary", "report", "ppt_outline", "viva", "literature_review", "visualization"}

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
    kind: str = Field(pattern="^(flashcards|mindmap|quiz|summary|report|ppt_outline|viva|literature_review|visualization)$")
    paper_id: str | None = None
    paper_ids: list[str] | None = Field(default=None, max_length=10)
    prompt: str = Field(default="", max_length=1000)
    count: int = Field(default=8, ge=1, le=20)


class ArtifactUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    payload: dict[str, Any] | None = None


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


@app.get("/api/papers/{paper_id}/file")
def paper_file(paper_id: str, user: dict[str, Any] = Depends(current_user)):
    result = owned_paper(paper_id, user)
    if not Path(result["stored_path"]).is_file():
        raise HTTPException(status_code=404, detail="Paper file not found")
    return FileResponse(result["stored_path"], media_type="application/pdf", filename=result["filename"])


@app.post("/api/papers/upload", status_code=201)
async def upload_paper(file: UploadFile = File(...), user: dict[str, Any] = Depends(current_user)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Only PDF files are allowed")
    paper_id, safe_name = str(uuid.uuid4()), Path(file.filename).name
    file_path = PAPERS_DIR / f"{paper_id}.pdf"
    with file_path.open("wb") as destination:
        shutil.copyfileobj(file.file, destination)
    if file_path.stat().st_size > MAX_UPLOAD_BYTES:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=413, detail="PDF must be 100 MB or smaller")
    try:
        pdf, chunks, next_number = pymupdf.open(file_path), [], 1
        for page_number, page in enumerate(pdf, start=1):
            page_chunks = chunk_text(page.get_text("text"), paper_id, page_number, start_number=next_number)
            chunks.extend(page_chunks)
            next_number += len(page_chunks)
        page_count = len(pdf)
        pdf.close()
        if not chunks:
            raise ValueError("No extractable text was found. This PDF may need OCR support.")
        save_paper(paper_id, safe_name, str(file_path), page_count, user["id"])
        save_chunks(chunks, embed([chunk["text"] for chunk in chunks]))
        record_activity(user["id"], "paper_uploaded", {"paper_id": paper_id, "filename": safe_name})
    except Exception as exc:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=f"Could not process PDF: {exc}") from exc
    return {"paper_id": paper_id, "filename": safe_name, "total_pages": page_count,
            "total_chunks": len(chunks), "status": "ready"}


@app.post("/api/chat")
def chat(request: ChatRequest, user: dict[str, Any] = Depends(current_user)):
    if request.paper_ids:
        for paper_id in request.paper_ids:
            owned_paper(paper_id, user)
    hits = hybrid_search(request.question, embed([request.question])[0], request.paper_ids, request.top_k, owner_id=user["id"])
    if not hits:
        raise HTTPException(status_code=404, detail="No indexed paper content was found. Upload a text-based PDF first.")
    citations = citations_for(hits)
    session = None
    if request.session_id:
        session = get_user_chat(user["id"], request.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Chat not found")
    else:
        session = create_chat_session(user["id"], request.question.strip()[:120], request.paper_ids[0] if request.paper_ids else None)
    save_chat_message(session["id"], "user", request.question)
    response = {"answer": answer(request.question, hits), "citations": citations,
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
    query = payload.prompt.strip() or f"Create {payload.kind} from {paper_names}"
    hits = hybrid_search(query, embed([query])[0], paper_ids, min(payload.count, 10), owner_id=user["id"])
    if not hits:
        raise HTTPException(status_code=404, detail="No text passages found for this paper")
    try:
        content = generate_study_artifact(payload.kind, query, hits, payload.count)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    artifact = save_artifact(user["id"], payload.kind, query[:200], {**content, "citations": citations_for(hits), "source_paper_ids": paper_ids}, paper_ids[0])
    record_activity(user["id"], f"generated_{payload.kind}", {"artifact_id": artifact["id"], "paper_ids": paper_ids})
    return {"artifact": artifact}


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
