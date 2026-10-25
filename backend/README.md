# ScholarMind backend

## What it does

`POST /api/auth/register` and `POST /api/auth/login` provide password-hashed accounts and bearer-token sessions. Accounts whose email is listed in `ADMIN_EMAILS` are promoted to administrators at startup. `/api/admin/overview` exposes account metadata and login attempts only to administrators.

`POST /api/papers/upload` accepts PDF, DOCX, PPTX, TXT, PNG, JPG, and JPEG files for the signed-in user. It extracts text (using OCR for scanned PDFs and images), makes overlapping page-aware chunks, embeds them with `all-MiniLM-L6-v2` (384 dimensions), and stores metadata plus vectors in PostgreSQL + pgvector. Paper retrieval and downloads are scoped to the signed-in account.

`POST /api/chat` performs hybrid retrieval (pgvector cosine similarity + PostgreSQL full-text search), returns page citations, and optionally calls an OpenAI-compatible LLM endpoint. Without an LLM key it returns retrieved evidence rather than fake generated answers.

Chat sessions and messages are stored per account. `GET /api/chats` lists recent sessions and `GET /api/chats/{chat_id}` reopens a conversation. Citation responses include the source passage, paper identifier, and page, which the UI can open in the PDF viewer.

`POST /api/learning/generate` creates paper-grounded flashcards, mind maps, quizzes, summaries, reports, viva prompts, literature-review content, visualisation outlines, or a PPT outline with speaker notes. Generated work and chat history are stored per user; `GET /api/me/data` returns that account's papers, saved items, and activity history.

Flashcards, quizzes, and mind maps use the local study agent: Ollama generates from retrieved passages in the selected paper, and the backend validates the returned structure and source-page evidence before saving. These three tools do not substitute excerpts or source-based recall text when generation fails. Install Ollama, pull a model such as `qwen3:4b`, and set `LLM_BASE_URL=http://127.0.0.1:11434` and `LLM_MODEL=qwen3:4b` in `backend/.env`. Generation fails with an explicit error if Ollama is unreachable, the model returns invalid output, or the paper does not support the requested artifact. Local throughput depends on the available hardware and model size.

PDF uploads are fingerprinted with SHA-256. Uploading an identical file again in the same account skips indexing and links to the existing paper; different accounts keep independent copies. To find and remove identical copies already in the database, stop the backend and run `python deduplicate_papers.py` from this directory for a preview, then `python deduplicate_papers.py --apply` to keep the oldest copy, reassign notes/chat/artifact references, and remove duplicate records and files. Run with the backend Python environment and a working `DATABASE_URL`.

## Setup

1. Install pgvector for the PostgreSQL server, then create the `scholarmind` database. The backend creates its tables and runs `CREATE EXTENSION IF NOT EXISTS vector` at startup.
2. Create a virtual environment and install dependencies: `pip install -r requirements.txt`.
3. Copy `.env.example` to `.env`, enter your PostgreSQL password, set a unique random `AUTH_SECRET` of at least 32 characters, and set `ADMIN_EMAILS` to the email address(es) that should receive admin access. Do this before registering the admin account; an existing account matching an admin email is promoted at backend startup.
   For flashcards, quizzes, and mind maps, also install Ollama, run `ollama pull qwen3:4b`, and use the local Ollama settings shown in `.env.example`.
4. Run `uvicorn main:app --reload --port 8000` from this directory.
5. Run `npm run dev` in the application root. Vite proxies `/api` to the backend.

On Windows, you can run `./start.ps1` from the `backend` directory instead. It selects a virtual environment that can import the required backend packages, avoiding stale environments that point to a removed Python installation.

## Tests

Install the backend development dependencies with `pip install -r requirements-dev.txt`, then run `python -m pytest tests -q` from this directory. The suite covers study-content generation, flashcard verification, and document extraction.

Use `http://localhost:8000/docs` to inspect endpoints. The PPT Generator can build source-grounded decks from every indexed chunk of an uploaded document, pasted notes, or supplied topic details; it does not add outside facts. Users can choose a research overview, lecture, thesis defense, conference talk, or project pitch, then export an editable `.pptx` with presenter notes. Paper-based slides retain source-page labels. The result summarizes the source to fit the chosen slide count. Media transcription and audio-video generation are not included yet.
