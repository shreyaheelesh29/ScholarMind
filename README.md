# ScholarMind
AI-powered academic research assistant that uses RAG and LLMs to analyze research papers, generate literature reviews, identify research gaps, create deep explanations, and generate presentations with source citations.

## Deploy a shared ScholarMind instance

The normal Vite setup (`npm run dev`) is for local development. It listens on HTTP, so open it as `http://localhost:5173` rather than `https://localhost:5173`. A `localhost` address only works on the same computer; it is not a shared online service.

For a shared deployment, this repository includes a Docker Compose stack with a React frontend, FastAPI backend, PostgreSQL + pgvector, persistent paper/model volumes, and Caddy-managed HTTPS. Use a Linux server with Docker Compose, a public domain whose DNS A/AAAA records point to that server, and inbound TCP ports 80 and 443 available. The backend and database are not published directly to the internet; Caddy is the public HTTPS entry point.

1. Clone this repository onto the server and enter the repository directory.
2. Copy `deploy.env.example` to `deploy.env`. Set `APP_DOMAIN`, a long random `POSTGRES_PASSWORD`, a separate random `AUTH_SECRET` (at least 32 characters), and `ADMIN_EMAILS` before starting. Use URL-safe random values for the database password. Put any LLM key in this server-only file; do not commit or share it.
3. Start the stack with `docker compose --env-file deploy.env up -d --build`.
4. Visit `https://<APP_DOMAIN>`. The first backend startup initializes the schema and downloads the embedding model, so initial readiness can take a few minutes. Check `docker compose --env-file deploy.env logs -f backend` if startup does not finish.
5. Register the administrator using the exact email in `ADMIN_EMAILS`; then users can register their own accounts on the same site. Paper files, chat, and generated study artifacts are scoped to each account.

The named Docker volumes persist PostgreSQL data, uploaded PDFs, and the embedding-model cache across container restarts. They are not backups: configure off-server encrypted backups for both `postgres_data` and `paper_files` before relying on this for important data. Existing local accounts and PDFs are not copied into a new deployment; data migration needs a separate planned backup/restore.

If a Gemini/API key was pasted into chat or committed previously, revoke it at its provider and use a newly generated key in `deploy.env`. Keep `deploy.env` out of Git. Public hosting can incur server, database, domain, storage, and model-provider costs; configure usage limits and backups with your hosting provider.
