"""Combine predicted class + RAG citations into a Nest-compatible diagnosis.

Stub-first: without ANTHROPIC_API_KEY returns a structured stub (model: "stub").
Claude / LlamaIndex wiring is intentionally deferred — keep deps lean until used.
"""

from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings
from app.services.rag_retriever import retrieve_citations

logger = logging.getLogger(__name__)


def diagnose(
    disease_class: str,
    image_id: str | None = None,
    *,
    rag_pdf_dir: str | None = None,
    anthropic_api_key: str | None = None,
) -> dict[str, Any]:
    """Return { diagnosis, citations[], model } for POST /diagnose."""
    _ = image_id  # reserved for grounded multimodal calls later
    citations = retrieve_citations(disease_class, rag_pdf_dir=rag_pdf_dir)

    api_key = (
        anthropic_api_key
        if anthropic_api_key is not None
        else settings.anthropic_api_key
    ).strip()

    if not api_key:
        return _stub_diagnosis(disease_class, citations)

    # TODO: call Claude Sonnet with class + citation passages when corpus + SDK are ready.
    # Prefer stub until LlamaIndex retrieval and prompt grounding are wired.
    logger.info(
        "ANTHROPIC_API_KEY set but LLM path not wired; returning stub for class %r",
        disease_class,
    )
    return _stub_diagnosis(disease_class, citations)


def _stub_diagnosis(
    disease_class: str,
    citations: list[dict[str, Any]],
) -> dict[str, Any]:
    n = len(citations)
    if n == 0:
        note = (
            f"Stub diagnosis for class '{disease_class}'. "
            "No class-aligned PDFs found under RAG_PDF_DIR; "
            "add files at RAG_PDF_DIR/{class_name}/*.pdf then wire retrieval/LLM."
        )
    else:
        note = (
            f"Stub diagnosis for class '{disease_class}' "
            f"with {n} registered PDF source(s). "
            "Passage extraction and Claude grounding not wired yet."
        )
    return {
        "diagnosis": note,
        "citations": citations,
        "model": "stub",
    }
