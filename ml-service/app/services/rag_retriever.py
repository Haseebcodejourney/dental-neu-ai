"""Class-aligned PDF lookup under RAG_PDF_DIR/{class_name}/*.pdf.

Scaffold only: lists PDFs as citation shells. No parsing, embeddings, or
LlamaIndex yet — wire those later when a corpus is available.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

# Reject path traversal / absolute segments in class folder names.
_SAFE_CLASS = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._\- ]{0,127}$")


def _class_dir(disease_class: str, rag_pdf_dir: str | None = None) -> Path | None:
    name = (disease_class or "").strip()
    if not name or not _SAFE_CLASS.match(name):
        logger.warning("Rejecting unsafe or empty disease class for RAG: %r", disease_class)
        return None
    root = Path(rag_pdf_dir if rag_pdf_dir is not None else settings.rag_pdf_dir)
    return root / name


def retrieve_citations(
    disease_class: str,
    rag_pdf_dir: str | None = None,
) -> list[dict[str, Any]]:
    """Return Nest-compatible citation dicts for PDFs under the class folder.

    Missing directory or zero PDFs → empty list (no fake medical text).
    Found PDFs → structural shells only (passage extraction not wired).
    """
    folder = _class_dir(disease_class, rag_pdf_dir)
    if folder is None:
        return []

    if not folder.is_dir():
        logger.info("No RAG folder for class %r at %s", disease_class, folder)
        return []

    pdfs = sorted(p for p in folder.glob("*.pdf") if p.is_file())
    if not pdfs:
        logger.info("No PDFs under %s", folder)
        return []

    citations: list[dict[str, Any]] = []
    for pdf in pdfs:
        citations.append(
            {
                "source": pdf.name,
                "page_or_section": None,
                "passage": "[PDF registered; passage extraction not wired]",
                "relevance_score": None,
            }
        )
    return citations
