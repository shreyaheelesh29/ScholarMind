"""Page-aware text chunking for ScholarMind's retrieval pipeline."""

from __future__ import annotations

import re
from typing import Any


def _normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _section_for(text: str) -> str | None:
    first_line = text.splitlines()[0].strip() if text.strip() else ""
    if 2 < len(first_line) < 120 and re.match(r"^(\d+(\.\d+)*\s+)?[A-Z][A-Za-z -]{2,}$", first_line):
        return first_line
    return None


def chunk_text(text: str, paper_id: str, page_number: int, chunk_size: int = 900,
               overlap: int = 160, start_number: int = 1) -> list[dict[str, Any]]:
    """Split text on word boundaries and retain page/section metadata."""
    original = text.strip()
    clean_text = _normalise(original)
    if not clean_text:
        return []
    section = _section_for(original)
    chunks: list[dict[str, Any]] = []
    start, chunk_number = 0, start_number
    while start < len(clean_text):
        end = min(start + chunk_size, len(clean_text))
        if end < len(clean_text):
            boundary = clean_text.rfind(" ", start, end)
            if boundary > start + chunk_size // 2:
                end = boundary
        value = clean_text[start:end].strip()
        if value:
            chunks.append({"paper_id": paper_id, "page_number": page_number,
                           "chunk_number": chunk_number, "section": section, "text": value})
            chunk_number += 1
        if end >= len(clean_text):
            break
        start = max(end - overlap, start + 1)
    return chunks
