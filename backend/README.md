# ScholarMind backend

## What it does

`POST /api/auth/register` and `POST /api/auth/login` provide password-hashed accounts and bearer-token sessions. Accounts whose email is listed in `ADMIN_EMAILS` are promoted to administrators at startup. `/api/admin/overview` exposes account metadata and login attempts only to administrators.

`POST /api/papers/upload` saves a PDF for the signed-in user, extracts text with PyMuPDF, makes overlapping page-aware chunks, embeds them with `all-MiniLM-L6-v2` (384 dimensions), and stores metadata plus vectors in PostgreSQL + pgvector. Paper retrieval and downloads are scoped to the signed-in account.

`POST /api/chat` performs hybrid retrieval (pgvector cosine similarity + PostgreSQL full-text search), returns page citations, and optionally calls an OpenAI-compatible LLM endpoint. Without an LLM key it returns retrieved evidence rather than fake generated answers.

Chat sessions and messages are stored per account. `GET /api/chats` lists recent sessions and `GET /api/chats/{chat_id}` reopens a conversation. Citation responses include the source passage, paper identifier, and page, which the UI can open in the PDF viewer.

`POST /api/learning/generate` creates paper-grounded flashcards, mind maps, quizzes, summaries, reports, viva prompts, literature-review content, visualisation outlines, or a PPT outline with speaker notes. Generated work and chat history are stored per user; `GET /api/me/data` returns that account's papers, saved items, and activity history.

## Setup

1. Install pgvector for the PostgreSQL server, then create the `scholarmind` database. The backend creates its tables and runs `CREATE EXTENSION IF NOT EXISTS vector` at startup.
2. Create a virtual environment and install dependencies: `pip install -r requirements.txt`.
3. Copy `.env.example` to `.env`, enter your PostgreSQL password, set a unique random `AUTH_SECRET` of at least 32 characters, and set `ADMIN_EMAILS` to the email address(es) that should receive admin access. Do this before registering the admin account; an existing account matching an admin email is promoted at backend startup.
4. Run `uvicorn main:app --reload --port 8000` from this directory.
5. Run `npm run dev` in the application root. Vite proxies `/api` to the backend.

Use `http://localhost:8000/docs` to inspect endpoints. Media transcription/audio-video generation and actual `.pptx` file export are not included yet; PPT generation currently stores a structured outline with speaker notes.
