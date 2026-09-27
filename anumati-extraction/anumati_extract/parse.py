"""Step 1 — PDF to text, with a page map.

Digital PDFs are read with pdfplumber. A page with (almost) no text layer is
a scan: it is rendered and read with Tesseract, English and Marathi, and
flagged as OCR so a reviewer knows to read it against the original.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pdfplumber

MIN_TEXT_CHARS = 40


@dataclass
class Page:
    number: int
    text: str
    ocr: bool


def _ocr(page: "pdfplumber.page.Page", lang: str) -> str:
    import pytesseract  # imported lazily: digital PDFs never need it

    image = page.to_image(resolution=300).original
    return pytesseract.image_to_string(image, lang=lang)


def read_pdf(path: str | Path, ocr_lang: str = "eng+mar") -> list[Page]:
    pages: list[Page] = []
    with pdfplumber.open(str(path)) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            if len(text.strip()) >= MIN_TEXT_CHARS:
                pages.append(Page(i, text, ocr=False))
                continue
            try:
                pages.append(Page(i, _ocr(page, ocr_lang), ocr=True))
            except Exception as exc:  # tesseract or its language pack missing
                pages.append(Page(i, f"[OCR unavailable: {exc}]", ocr=True))
    return pages
