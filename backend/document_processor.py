from __future__ import annotations

from pathlib import Path
from typing import Any

import pymupdf
import pytesseract
from PIL import Image
from docx import Document
from pptx import Presentation


SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".pptx",
    ".txt",
    ".png",
    ".jpg",
    ".jpeg",
}


def get_file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def is_supported_file(filename: str) -> bool:
    return get_file_extension(filename) in SUPPORTED_EXTENSIONS


def extract_pdf(file_path: Path) -> dict[str, Any]:
    pages = []

    with pymupdf.open(file_path) as document:
        for page_number, page in enumerate(document, start=1):
            text = page.get_text("text").strip()
            text = pytesseract.image_to_string(image).strip()
            # OCR fallback for scanned/image-only PDF pages
            if not text:
                pix = page.get_pixmap()
                image = Image.frombytes(
                    "RGB",
                    [pix.width, pix.height],
                    pix.samples,
                )

                text = pytesseract.image_to_string(image).strip()

            if text:
                pages.append(
                    {
                        "page_number": page_number,
                        "text": text,
                    }
                )

        page_count = len(document)

    return {
        "text": "\n\n".join(page["text"] for page in pages),
        "pages": pages,
        "page_count": page_count,
        "document_type": "pdf",
    }


def extract_docx(file_path: Path) -> dict[str, Any]:
    document = Document(file_path)

    paragraphs = []

    # Normal paragraphs
    for paragraph in document.paragraphs:
        text = paragraph.text.strip()

        if text:
            paragraphs.append(text)

    # Tables
    for table in document.tables:
        for row in table.rows:
            row_text = " | ".join(
                cell.text.strip()
                for cell in row.cells
            )

            if row_text:
                paragraphs.append(row_text)

    full_text = "\n\n".join(paragraphs)

    return {
        "text": full_text,
        "pages": [
            {
                "page_number": 1,
                "text": full_text,
            }
        ]
        if full_text
        else [],
        "page_count": 1 if full_text else 0,
        "document_type": "docx",
    }


def extract_pptx(file_path: Path) -> dict[str, Any]:
    presentation = Presentation(file_path)

    slides = []

    for slide_number, slide in enumerate(
        presentation.slides,
        start=1,
    ):
        slide_text = []

        for shape in slide.shapes:
            if hasattr(shape, "text"):
                text = shape.text.strip()

                if text:
                    slide_text.append(text)

        combined_text = "\n".join(slide_text).strip()

        if combined_text:
            slides.append(
                {
                    "page_number": slide_number,
                    "text": combined_text,
                }
            )

    return {
        "text": "\n\n".join(
            slide["text"] for slide in slides
        ),
        "pages": slides,
        "page_count": len(presentation.slides),
        "document_type": "pptx",
    }


def extract_txt(file_path: Path) -> dict[str, Any]:
    text = file_path.read_text(
        encoding="utf-8",
        errors="replace",
    ).strip()

    return {
        "text": text,
        "pages": [
            {
                "page_number": 1,
                "text": text,
            }
        ]
        if text
        else [],
        "page_count": 1 if text else 0,
        "document_type": "txt",
    }


def extract_image(file_path: Path) -> dict[str, Any]:
    image = Image.open(file_path)

    # Convert image to grayscale
    image = image.convert("L")

    # Simple thresholding for better OCR
    image = image.point(
        lambda x: 0 if x < 150 else 255,
        "1",
    )

    text = pytesseract.image_to_string(image).strip()

    return {
        "text": text,
        "pages": [
            {
                "page_number": 1,
                "text": text,
            }
        ]
        if text
        else [],
        "page_count": 1,
        "document_type": "image",
    }


def extract_text(file_path: Path) -> dict[str, Any]:
    extension = get_file_extension(file_path.name)

    if extension == ".pdf":
        return extract_pdf(file_path)

    if extension == ".docx":
        return extract_docx(file_path)

    if extension == ".pptx":
        return extract_pptx(file_path)

    if extension == ".txt":
        return extract_txt(file_path)

    if extension in {".png", ".jpg", ".jpeg"}:
        return extract_image(file_path)

    raise ValueError(
        f"Unsupported file type: {extension}"
    )