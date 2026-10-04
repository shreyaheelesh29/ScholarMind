# ScholarMind backend

## What it does

`POST /api/auth/register` and `POST /api/auth/login` provide password-hashed accounts and bearer-token sessions. Accounts whose email is listed in `ADMIN_EMAILS` are promoted to administrators at startup. `/api/admin/overview` exposes account metadata and login attempts only to administrators.

`POST /api/papers/upload` saves a PDF for the signed-in user, extracts text with PyMuPDF, makes overlapping page-aware chunks, embeds them with `all-MiniLM-L6-v2` (384 dimensions), and stores metadata plus vectors in PostgreSQL + pgvector. Paper retrieval and downloads are scoped to the signed-in account.

`POST /api/chat` performs hybrid retrieval (pgvector cosine similarity + PostgreSQL full-text search), returns page citations, and optionally calls an OpenAI-compatible LLM endpoint. Without an LLM key it returns retrieved evidence rather than fake generated answers.

Chat sessions and messages are stored per account. `GET /api/chats` lists recent sessions and `GET /api/chats/{chat_id}` reopens a conversation. Citation responses include the source passage, paper identifier, and page, which the UI can open in the PDF viewer.

`POST /api/learning/generate` creates paper-grounded flashcards, mind maps, quizzes, summaries, reports, viva prompts, literature-review content, visualisation outlines, or a PPT outline with speaker notes. Generated work and chat history are stored per user; `GET /api/me/data` returns that account's papers, saved items, and activity history.

## Interactive mind-map scope and response format

The learning page creates the first paper-grounded graph with `POST /api/learning/generate` (`kind: "mindmap"`). Selecting a leaf or choosing **Generate deeper branches** calls `POST /api/learning/mindmap/expand`. Expansion is limited to the signed-in user's selected paper, retrieves relevant indexed passages, and asks the configured LLM for up to five new children. The backend attaches an exact page quote to every child and omits concepts that cannot be matched to the retrieved paper text. Users can continue expanding past three levels while the paper supports more concepts, up to 250 nodes per map. Expansion preserves existing node and edge IDs; the frontend merges the additions and updates the saved artifact with `PATCH /api/artifacts/{artifact_id}`. The UI supports branch collapse/expand, breadcrumbs, concept search, click-to-focus zoom, drag-to-pan in a fixed canvas, source details, and Markdown outline download. It does not search the public web or claim unsupported examples as paper facts.

The expansion request is:

```json
{
  "paper_id": "paper UUID",
  "node_id": "existing-node-id",
  "node_label": "Consensus mechanisms",
  "breadcrumb": ["Blockchain", "Consensus mechanisms"],
  "context": "Optional summary, details, or evidence already attached to this node",
  "existing_nodes": [
    {"id": "root", "label": "Blockchain"},
    {"id": "node-consensus", "label": "Consensus mechanisms"}
  ]
}
```

The validated response shape is shown below with one child object; the model proposes 3–5 children, and the backend returns only those with verifiable paper evidence:

```json
{
  "parent_id": "existing-node-id",
  "children": [{
    "id": "existing-node-id-proof-of-work-abc123",
    "label": "Proof of Work",
    "summary": "A brief source-supported explanation.",
    "details": "A fuller definition or mechanism grounded in the paper.",
    "example": "A source-supported example, or an empty string.",
    "key_points": ["A concise supported point"],
    "related_concepts": ["Mining difficulty"],
    "importance": true,
    "page": 4,
    "evidence": "A verbatim passage from page 4 of the selected PDF."
  }],
  "edges": [{"source": "existing-node-id", "target": "existing-node-id-proof-of-work-abc123", "label": "includes"}],
  "generation_mode": "ai"
}
```

The model's raw JSON schema requires `children` and `relationships`. Each child contains an ID, label, summary, details, optional example, key points, related concepts, and an importance flag. Relationship endpoints must refer to a generated child or an existing node. The server assigns final IDs, verifies labels and source evidence, and returns the API shape above.

PDF uploads are fingerprinted with SHA-256. Uploading an identical file again in the same account skips indexing and links to the existing paper; different accounts keep independent copies. To find and remove identical copies already in the database, stop the backend and run `python deduplicate_papers.py` from this directory for a preview, then `python deduplicate_papers.py --apply` to keep the oldest copy, reassign notes/chat/artifact references, and remove duplicate records and files. Run with the backend Python environment and a working `DATABASE_URL`.

## Setup

1. Install pgvector for the PostgreSQL server, then create the `scholarmind` database. The backend creates its tables and runs `CREATE EXTENSION IF NOT EXISTS vector` at startup.
2. Create a virtual environment and install dependencies: `pip install -r requirements.txt`.
3. Copy `.env.example` to `.env`, enter your PostgreSQL password, set a unique random `AUTH_SECRET` of at least 32 characters, and set `ADMIN_EMAILS` to the email address(es) that should receive admin access. Do this before registering the admin account; an existing account matching an admin email is promoted at backend startup.
4. Run `uvicorn main:app --reload --port 8000` from this directory.
5. Run `npm run dev` in the application root. Vite proxies `/api` to the backend.

Use `http://localhost:8000/docs` to inspect endpoints. Media transcription/audio-video generation and actual `.pptx` file export are not included yet; PPT generation currently stores a structured outline with speaker notes.
