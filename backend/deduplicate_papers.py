"""Find and remove byte-identical PDF uploads within each user account.

Run from the backend directory. Defaults to preview mode; pass --apply to make
the changes. The oldest paper record is retained and saved references are moved
to it before duplicate records are removed.
"""
from __future__ import annotations

import argparse
import hashlib
from collections import defaultdict
from pathlib import Path
from typing import Any

import psycopg
from psycopg.types.json import Jsonb

from database import connection

STORAGE_DIR = Path(__file__).resolve().parent / "data" / "papers"


def file_sha256(path: Path) -> str | None:
    try:
        digest = hashlib.sha256()
        with path.open("rb") as source:
            for block in iter(lambda: source.read(1024 * 1024), b""):
                digest.update(block)
        return digest.hexdigest()
    except OSError:
        return None


def replace_exact_id(value: Any, old_id: str, new_id: str) -> Any:
    if isinstance(value, str):
        return new_id if value == old_id else value
    if isinstance(value, list):
        return [replace_exact_id(item, old_id, new_id) for item in value]
    if isinstance(value, dict):
        return {key: replace_exact_id(item, old_id, new_id) for key, item in value.items()}
    return value


def safe_to_remove(path: Path) -> bool:
    try:
        path.resolve().relative_to(STORAGE_DIR.resolve())
        return True
    except (OSError, ValueError):
        return False


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="update the database and remove duplicate files")
    args = parser.parse_args()

    # Add the nullable column for databases created before duplicate detection.
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("ALTER TABLE papers ADD COLUMN IF NOT EXISTS content_sha256 TEXT")
        conn.commit()

    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cursor:
        cursor.execute("""SELECT id::text AS id, owner_id::text AS owner_id, filename,
                          stored_path, created_at
                       FROM papers WHERE owner_id IS NOT NULL ORDER BY created_at, id""")
        papers = list(cursor.fetchall())

    groups: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    paper_hashes: dict[str, str] = {}
    for paper in papers:
        digest = file_sha256(Path(paper["stored_path"]))
        if digest:
            paper_hashes[paper["id"]] = digest
            groups[(paper["owner_id"], digest)].append(paper)

    duplicate_pairs: list[tuple[dict[str, Any], dict[str, Any], str]] = []
    for (_, digest), copies in groups.items():
        if len(copies) > 1:
            keeper = copies[0]
            duplicate_pairs.extend((keeper, duplicate, digest) for duplicate in copies[1:])

    if not args.apply:
        print(f"Scanned {len(papers)} owned paper records; found {len(duplicate_pairs)} duplicate copies.")
        for keeper, duplicate, _ in duplicate_pairs:
            print(f"DUPLICATE: {duplicate['filename']} ({duplicate['id']}) -> keep {keeper['filename']} ({keeper['id']})")
        print("Preview only. Run with --apply to store file hashes and remove duplicates.")
        return

    duplicate_files: list[Path] = []
    files_outside_storage = 0
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cursor:
        for paper_id, digest in paper_hashes.items():
            cursor.execute("UPDATE papers SET content_sha256 = %s WHERE id = %s", (digest, paper_id))

        for keeper, duplicate, _ in duplicate_pairs:
            owner_id, old_id, new_id = keeper["owner_id"], duplicate["id"], keeper["id"]
            cursor.execute("UPDATE paper_annotations SET paper_id = %s WHERE paper_id = %s AND user_id = %s",
                           (new_id, old_id, owner_id))
            cursor.execute("UPDATE chat_sessions SET paper_id = %s WHERE paper_id = %s AND user_id = %s",
                           (new_id, old_id, owner_id))

            cursor.execute("""SELECT id, paper_id::text AS paper_id, payload FROM study_artifacts
                           WHERE user_id = %s AND (paper_id = %s OR payload::text LIKE %s)""",
                           (owner_id, old_id, f"%{old_id}%"))
            for artifact in cursor.fetchall():
                updated_payload = replace_exact_id(artifact["payload"], old_id, new_id)
                cursor.execute("""UPDATE study_artifacts SET paper_id = %s, payload = %s
                               WHERE id = %s""",
                               (new_id if artifact["paper_id"] == old_id else artifact["paper_id"],
                                Jsonb(updated_payload), artifact["id"]))

            cursor.execute("""SELECT m.id, m.citations, m.sources FROM chat_messages m
                           JOIN chat_sessions s ON s.id = m.session_id
                           WHERE s.user_id = %s AND (m.citations::text LIKE %s OR m.sources::text LIKE %s)""",
                           (owner_id, f"%{old_id}%", f"%{old_id}%"))
            for message in cursor.fetchall():
                cursor.execute("UPDATE chat_messages SET citations = %s, sources = %s WHERE id = %s",
                               (Jsonb(replace_exact_id(message["citations"], old_id, new_id)),
                                Jsonb(replace_exact_id(message["sources"], old_id, new_id)), message["id"]))

            cursor.execute("DELETE FROM papers WHERE id = %s AND owner_id = %s", (old_id, owner_id))
            duplicate_path = Path(duplicate["stored_path"])
            if duplicate_path == Path(keeper["stored_path"]):
                continue
            if safe_to_remove(duplicate_path):
                duplicate_files.append(duplicate_path)
            else:
                files_outside_storage += 1
        conn.commit()

    removed_files = 0
    failed_file_removals = 0
    for path in duplicate_files:
        try:
            path.unlink(missing_ok=True)
            removed_files += 1
        except OSError as exc:
            failed_file_removals += 1
            print(f"Could not remove duplicate file {path}: {exc}")

    print(f"Scanned {len(papers)} owned paper records; removed {len(duplicate_pairs)} duplicate records and {removed_files} duplicate files.")
    if files_outside_storage or failed_file_removals:
        print(f"Files needing manual review: {files_outside_storage + failed_file_removals}.")
    print("The oldest identical paper per account was retained; annotations, chats, and saved artifact references were reassigned.")


if __name__ == "__main__":
    main()
