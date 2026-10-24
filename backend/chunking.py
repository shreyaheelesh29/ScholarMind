"""Page-aware text chunking for ScholarMind's retrieval pipeline."""

from __future__ import annotations

import re
from typing import Any


def _normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _section_for(text: str) -> str | None:
    first_line = text.splitlines()[0].strip() if text.strip() else ""
    explicit = re.match(r"^Heading\s+\d+\s*:\s*(.+)$", first_line, flags=re.IGNORECASE)
    if explicit:
        first_line = explicit.group(1).strip()
    if 2 < len(first_line) < 120 and re.match(r"^(\d+(\.\d+)*\s+)?[A-Z][A-Za-z -]{2,}$", first_line):
        return first_line
    return None


def _heading_label(line: str) -> str | None:
    value = line.strip()
    explicit = re.match(r"^Heading\s+\d+\s*:\s*(.+)$", value, flags=re.IGNORECASE)
    if explicit:
        return explicit.group(1).strip()
    if not value or len(value) > 100 or re.search(r"[.!?]$", value):
        return None
    words = value.split()
    if len(words) > 10:
        return None
    # Recognize short section titles and numbered headings while avoiding
    # ordinary sentence lines from extracted PDF text.
    if (re.match(r"^\d+(?:\.\d+)*\s+[A-Z]", value)
            or (value.isupper() and len(words) <= 10)
            or (len(words) <= 8 and value[:1].isupper()
                and all(word[:1].isupper() or word.casefold() in {"and", "of", "for", "in", "to"}
                        for word in words))):
        return value
    return None


def chunk_text(text: str, paper_id: str, page_number: int, chunk_size: int = 900,
               overlap: int = 160, start_number: int = 1) -> list[dict[str, Any]]:
    """Split text on word boundaries and retain page/section metadata."""
    original = text.strip()
    if not _normalise(original):
        return []
    chunks: list[dict[str, Any]] = []
    sections: list[tuple[str | None, str]] = []
    current_section = None
    current_lines: list[str] = []
    for line in original.splitlines():
        heading = _heading_label(line)
        if heading:
            if current_lines:
                sections.append((current_section, "\n".join(current_lines)))
                current_lines = []
            current_section = heading
        else:
            current_lines.append(line)
    if current_lines:
        sections.append((current_section, "\n".join(current_lines)))
    if not sections:
        sections = [(_section_for(original), original)]

    chunk_number = start_number
    for section, section_text in sections:
        clean_text = _normalise(section_text)
        start = 0
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
