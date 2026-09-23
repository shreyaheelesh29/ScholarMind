"""PostgreSQL + pgvector persistence for ScholarMind."""

from __future__ import annotations

import os
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

import psycopg
from dotenv import load_dotenv
from pgvector import Vector
from pgvector.psycopg import register_vector
from psycopg.types.json import Jsonb

load_dotenv(Path(__file__).with_name(".env"))
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/scholarmind")

SCHEMA = """
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS papers (
 id UUID PRIMARY KEY, filename TEXT NOT NULL, stored_path TEXT NOT NULL,
 page_count INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS users (
 id UUID PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_login_at TIMESTAMPTZ
);
ALTER TABLE papers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS papers_owner_idx ON papers(owner_id, created_at DESC);
CREATE TABLE IF NOT EXISTS login_events (
 id BIGSERIAL PRIMARY KEY, user_id UUID REFERENCES users(id) ON DELETE SET NULL,
 email TEXT NOT NULL, succeeded BOOLEAN NOT NULL, ip_address TEXT,
 user_agent TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS login_events_created_idx ON login_events(created_at DESC);
CREATE TABLE IF NOT EXISTS study_artifacts (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 paper_id UUID REFERENCES papers(id) ON DELETE SET NULL, kind TEXT NOT NULL,
 title TEXT NOT NULL, payload JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS study_artifacts_user_idx ON study_artifacts(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS activity_events (
 id BIGSERIAL PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 action TEXT NOT NULL, details JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS activity_events_user_idx ON activity_events(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS chat_sessions (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 paper_id UUID REFERENCES papers(id) ON DELETE SET NULL, title TEXT NOT NULL DEFAULT 'New chat',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_sessions_user_idx ON chat_sessions(user_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS chat_messages (
 id BIGSERIAL PRIMARY KEY, session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
 role TEXT NOT NULL CHECK (role IN ('user', 'assistant')), content TEXT NOT NULL,
 citations JSONB NOT NULL DEFAULT '[]'::jsonb, sources JSONB NOT NULL DEFAULT '[]'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages(session_id, id);
CREATE TABLE IF NOT EXISTS paper_chunks (
 id BIGSERIAL PRIMARY KEY, paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
 page_number INTEGER NOT NULL, chunk_number INTEGER NOT NULL, section TEXT,
 content TEXT NOT NULL, embedding vector(384) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (paper_id, chunk_number)
);
CREATE INDEX IF NOT EXISTS paper_chunks_paper_id_idx ON paper_chunks(paper_id);
CREATE INDEX IF NOT EXISTS paper_chunks_fts_idx ON paper_chunks USING GIN (to_tsvector('english', content));
"""

@contextmanager
def connection() -> Iterator[psycopg.Connection]:
    with psycopg.connect(DATABASE_URL) as conn:
        register_vector(conn)
        yield conn

def initialise() -> None:
    with connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(SCHEMA)
        conn.commit()


def sync_admin_emails() -> None:
    emails = [value.strip().lower() for value in os.getenv("ADMIN_EMAILS", "").split(",") if value.strip()]
    if not emails:
        return
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("UPDATE users SET role = 'admin' WHERE email = ANY(%s)", (emails,))
        conn.commit()

def save_paper(paper_id: str, filename: str, stored_path: str, page_count: int, owner_id: str | None = None) -> None:
    with connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO papers (id, filename, stored_path, page_count, owner_id) VALUES (%s, %s, %s, %s, %s)",
                           (paper_id, filename, stored_path, page_count, owner_id))
        conn.commit()

def save_chunks(chunks: list[dict[str, Any]], embeddings: list[list[float]]) -> None:
    rows = [(c["paper_id"], c["page_number"], c["chunk_number"], c["section"], c["text"], e)
            for c, e in zip(chunks, embeddings, strict=True)]
    with connection() as conn:
        with conn.cursor() as cursor:
            cursor.executemany("""INSERT INTO paper_chunks
              (paper_id, page_number, chunk_number, section, content, embedding)
              VALUES (%s, %s, %s, %s, %s, %s)""", rows)
        conn.commit()

def list_papers() -> list[dict[str, Any]]:
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cursor:
        cursor.execute("""SELECT p.id::text, p.owner_id::text, p.filename, p.page_count, p.created_at, COUNT(c.id)::int AS chunk_count
                       FROM papers p LEFT JOIN paper_chunks c ON c.paper_id = p.id
                       GROUP BY p.id ORDER BY p.created_at DESC""")
        return list(cursor.fetchall())

def get_paper(paper_id: str) -> dict[str, Any] | None:
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cursor:
        cursor.execute("SELECT id::text, owner_id::text, filename, stored_path, page_count, created_at FROM papers WHERE id = %s", (paper_id,))
        return cursor.fetchone()


def create_user(user_id: str, name: str, email: str, password_hash: str, role: str) -> dict[str, Any]:
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cursor:
        cursor.execute("""INSERT INTO users (id, name, email, password_hash, role)
                       VALUES (%s, %s, %s, %s, %s)
                       RETURNING id::text, name, email, role, created_at, last_login_at""",
                       (user_id, name, email, password_hash, role))
        result = cursor.fetchone()
        conn.commit()
        return result


def find_user_by_email(email: str) -> dict[str, Any] | None:
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cursor:
        cursor.execute("SELECT id::text, name, email, password_hash, role, created_at, last_login_at FROM users WHERE email = %s", (email,))
        return cursor.fetchone()


def get_user(user_id: str) -> dict[str, Any] | None:
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cursor:
        cursor.execute("SELECT id::text, name, email, role, created_at, last_login_at FROM users WHERE id = %s", (user_id,))
        return cursor.fetchone()


def record_login(email: str, succeeded: bool, user_id: str | None, ip_address: str | None, user_agent: str | None) -> None:
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("INSERT INTO login_events (user_id, email, succeeded, ip_address, user_agent) VALUES (%s, %s, %s, %s, %s)",
                       (user_id, email, succeeded, ip_address, (user_agent or "")[:500]))
        if succeeded and user_id:
            cursor.execute("UPDATE users SET last_login_at = NOW() WHERE id = %s", (user_id,))
            cursor.execute("INSERT INTO activity_events (user_id, action, details) VALUES (%s, 'login', %s)",
                           (user_id, Jsonb({})))
        conn.commit()


def record_activity(user_id: str, action: str, details: dict[str, Any] | None = None) -> None:
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("INSERT INTO activity_events (user_id, action, details) VALUES (%s, %s, %s)",
                       (user_id, action, Jsonb(details or {})))
        conn.commit()


def save_artifact(user_id: str, kind: str, title: str, payload: dict[str, Any], paper_id: str | None = None) -> dict[str, Any]:
    artifact_id = str(__import__("uuid").uuid4())
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cursor:
        cursor.execute("""INSERT INTO study_artifacts (id, user_id, kind, title, payload, paper_id)
                       VALUES (%s, %s, %s, %s, %s, %s)
                       RETURNING id::text, user_id::text, paper_id::text, kind, title, payload, created_at, updated_at""",
                       (artifact_id, user_id, kind, title[:200], Jsonb(payload), paper_id))
        result = cursor.fetchone()
        conn.commit()
        return result


def list_user_data(user_id: str) -> dict[str, Any]:
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cursor:
        cursor.execute("""SELECT p.id::text, p.filename, p.page_count, p.created_at,
                       COUNT(c.id)::int AS chunk_count FROM papers p
                       LEFT JOIN paper_chunks c ON c.paper_id = p.id WHERE p.owner_id = %s
                       GROUP BY p.id ORDER BY p.created_at DESC""", (user_id,))
        papers = list(cursor.fetchall())
        cursor.execute("""SELECT id::text, paper_id::text, kind, title, payload, created_at, updated_at
                       FROM study_artifacts WHERE user_id = %s ORDER BY created_at DESC LIMIT 200""", (user_id,))
        artifacts = list(cursor.fetchall())
        cursor.execute("""SELECT id, action, details, created_at FROM activity_events
                       WHERE user_id = %s ORDER BY created_at DESC LIMIT 200""", (user_id,))
        history = list(cursor.fetchall())
        cursor.execute("""SELECT id::text, paper_id::text, title, created_at, updated_at
                       FROM chat_sessions WHERE user_id = %s ORDER BY updated_at DESC LIMIT 100""", (user_id,))
        chats = list(cursor.fetchall())
        return {"papers": papers, "artifacts": artifacts, "chats": chats, "history": history}


def create_chat_session(user_id: str, title: str, paper_id: str | None) -> dict[str, Any]:
    chat_id = str(__import__("uuid").uuid4())
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cursor:
        cursor.execute("""INSERT INTO chat_sessions (id, user_id, paper_id, title)
                       VALUES (%s, %s, %s, %s)
                       RETURNING id::text, paper_id::text, title, created_at, updated_at""",
                       (chat_id, user_id, paper_id, title[:120] or "New chat"))
        result = cursor.fetchone()
        conn.commit()
        return result


def list_user_chats(user_id: str) -> list[dict[str, Any]]:
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cursor:
        cursor.execute("""SELECT s.id::text, s.paper_id::text, s.title, s.created_at, s.updated_at,
                       (SELECT content FROM chat_messages WHERE session_id = s.id AND role = 'user' ORDER BY id LIMIT 1) AS preview,
                       COUNT(m.id)::int AS message_count
                       FROM chat_sessions s LEFT JOIN chat_messages m ON m.session_id = s.id
                       WHERE s.user_id = %s GROUP BY s.id ORDER BY s.updated_at DESC LIMIT 100""", (user_id,))
        return list(cursor.fetchall())


def get_user_chat(user_id: str, chat_id: str) -> dict[str, Any] | None:
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cursor:
        cursor.execute("""SELECT id::text, paper_id::text, title, created_at, updated_at
                       FROM chat_sessions WHERE id = %s AND user_id = %s""", (chat_id, user_id))
        session = cursor.fetchone()
        if not session:
            return None
        cursor.execute("""SELECT id, role, content, citations, sources, created_at
                       FROM chat_messages WHERE session_id = %s ORDER BY id""", (chat_id,))
        session["messages"] = list(cursor.fetchall())
        return session


def save_chat_message(chat_id: str, role: str, content: str,
                      citations: list[dict[str, Any]] | None = None,
                      sources: list[dict[str, Any]] | None = None) -> None:
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("""INSERT INTO chat_messages (session_id, role, content, citations, sources)
                       VALUES (%s, %s, %s, %s, %s)""",
                       (chat_id, role, content, Jsonb(citations or []), Jsonb(sources or [])))
        cursor.execute("UPDATE chat_sessions SET updated_at = NOW() WHERE id = %s", (chat_id,))
        conn.commit()


def list_admin_users() -> list[dict[str, Any]]:
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cursor:
        cursor.execute("""SELECT u.id::text, u.name, u.email, u.role, u.created_at, u.last_login_at,
                       COUNT(DISTINCT p.id)::int AS paper_count,
                       COUNT(DISTINCT a.id)::int AS artifact_count
                       FROM users u LEFT JOIN papers p ON p.owner_id = u.id
                       LEFT JOIN study_artifacts a ON a.user_id = u.id
                       GROUP BY u.id ORDER BY u.created_at DESC""")
        return list(cursor.fetchall())


def list_admin_logins(limit: int = 200) -> list[dict[str, Any]]:
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cursor:
        cursor.execute("""SELECT id, user_id::text, email, succeeded, ip_address, user_agent, created_at
                       FROM login_events ORDER BY created_at DESC LIMIT %s""", (limit,))
        return list(cursor.fetchall())


def update_user_artifact(user_id: str, artifact_id: str, title: str | None, payload: dict[str, Any] | None) -> dict[str, Any] | None:
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cursor:
        cursor.execute("""UPDATE study_artifacts SET title = COALESCE(%s, title),
                       payload = COALESCE(%s, payload), updated_at = NOW()
                       WHERE id = %s AND user_id = %s
                       RETURNING id::text, user_id::text, paper_id::text, kind, title, payload, created_at, updated_at""",
                       (title[:200] if title else None, Jsonb(payload) if payload is not None else None, artifact_id, user_id))
        result = cursor.fetchone()
        conn.commit()
        return result


def delete_user_artifact(user_id: str, artifact_id: str) -> bool:
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("DELETE FROM study_artifacts WHERE id = %s AND user_id = %s", (artifact_id, user_id))
        deleted = cursor.rowcount > 0
        conn.commit()
        return deleted

def hybrid_search(query: str, query_embedding: list[float], paper_ids: list[str] | None, limit: int,
                  owner_id: str | None = None) -> list[dict[str, Any]]:
    filter_sql = "AND c.paper_id = ANY(%(paper_ids)s::uuid[])" if paper_ids else ""
    owner_filter = "AND p.owner_id = %(owner_id)s::uuid" if owner_id else ""
    params: dict[str, Any] = {"query": query, "embedding": Vector(query_embedding), "limit": limit}
    if paper_ids: params["paper_ids"] = paper_ids
    if owner_id: params["owner_id"] = owner_id
    sql = f"""WITH vector_hits AS (
      SELECT c.id, ROW_NUMBER() OVER (ORDER BY c.embedding <=> %(embedding)s) AS rank
      FROM paper_chunks c JOIN papers p ON p.id = c.paper_id WHERE TRUE {filter_sql} {owner_filter} ORDER BY c.embedding <=> %(embedding)s LIMIT %(limit)s
    ), keyword_hits AS (
      SELECT c.id, ROW_NUMBER() OVER (ORDER BY ts_rank_cd(to_tsvector('english', c.content), websearch_to_tsquery('english', %(query)s)) DESC) AS rank
      FROM paper_chunks c JOIN papers p ON p.id = c.paper_id WHERE to_tsvector('english', c.content) @@ websearch_to_tsquery('english', %(query)s) {filter_sql} {owner_filter}
      ORDER BY ts_rank_cd(to_tsvector('english', c.content), websearch_to_tsquery('english', %(query)s)) DESC LIMIT %(limit)s
    ), fused AS (
      SELECT id, SUM(1.0 / (60 + rank)) AS score FROM (SELECT id, rank FROM vector_hits UNION ALL SELECT id, rank FROM keyword_hits) ranks GROUP BY id
    ) SELECT p.id::text AS paper_id, p.filename, c.page_number, c.chunk_number, COALESCE(c.section, 'Document text') AS section, c.content, f.score
      FROM fused f JOIN paper_chunks c ON c.id = f.id JOIN papers p ON p.id = c.paper_id ORDER BY f.score DESC LIMIT %(limit)s"""
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cursor:
        cursor.execute(sql, params)
        return list(cursor.fetchall())
