"""Class-aligned PDF retrieval under RAG_PDF_DIR/<class_slug>/*.pdf.

Light local chunker (pypdf + keyword scoring). Interface stays swap-compatible
with a future LlamaIndex backend: retrieve_citations(...) → Nest citation dicts.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

from app.core.config import settings
from app.services.class_taxonomy import resolve_class_slug

logger = logging.getLogger(__name__)

# Reject path traversal / absolute segments in class folder names.
_SAFE_SLUG = re.compile(r"^[a-z0-9][a-z0-9\-]{0,127}$")
_TOKEN_RE = re.compile(r"[a-z0-9]+", re.IGNORECASE)

# ~700 chars with overlap keeps passages short enough for Claude grounding.
_CHUNK_SIZE = 700
_CHUNK_OVERLAP = 120
_DEFAULT_TOP_K = 6


@dataclass(frozen=True)
class _Chunk:
    source: str
    page_or_section: str | None
    passage: str
    disease_class: str
    class_slug: str


def rag_root(rag_pdf_dir: str | None = None) -> Path:
    return Path(rag_pdf_dir if rag_pdf_dir is not None else settings.rag_pdf_dir)


def _class_dir(disease_class: str, rag_pdf_dir: str | None = None) -> Path | None:
    slug = resolve_class_slug(disease_class)
    if not slug or not _SAFE_SLUG.match(slug):
        logger.warning("Rejecting unsafe or empty disease class for RAG: %r", disease_class)
        return None
    return rag_root(rag_pdf_dir) / slug


def _tokenize(text: str) -> set[str]:
    return {t.lower() for t in _TOKEN_RE.findall(text) if len(t) > 2}


def _chunk_page_text(text: str) -> list[str]:
    cleaned = re.sub(r"\s+", " ", (text or "")).strip()
    if not cleaned:
        return []
    if len(cleaned) <= _CHUNK_SIZE:
        return [cleaned]

    chunks: list[str] = []
    start = 0
    while start < len(cleaned):
        end = min(len(cleaned), start + _CHUNK_SIZE)
        piece = cleaned[start:end].strip()
        if piece:
            chunks.append(piece)
        if end >= len(cleaned):
            break
        start = max(0, end - _CHUNK_OVERLAP)
    return chunks


def _extract_pdf_chunks(
    pdf_path: Path,
    *,
    disease_class: str,
    class_slug: str,
) -> list[_Chunk]:
    try:
        from pypdf import PdfReader
    except ImportError:
        logger.warning("pypdf not installed; cannot extract text from %s", pdf_path.name)
        return [
            _Chunk(
                source=pdf_path.name,
                page_or_section=None,
                passage="[PDF registered; install pypdf for passage extraction]",
                disease_class=disease_class,
                class_slug=class_slug,
            )
        ]

    chunks: list[_Chunk] = []
    try:
        reader = PdfReader(str(pdf_path))
        for page_idx, page in enumerate(reader.pages, start=1):
            try:
                page_text = page.extract_text() or ""
            except Exception:
                logger.exception("Failed extracting page %s of %s", page_idx, pdf_path.name)
                continue
            for piece in _chunk_page_text(page_text):
                chunks.append(
                    _Chunk(
                        source=pdf_path.name,
                        page_or_section=f"p.{page_idx}",
                        passage=piece,
                        disease_class=disease_class,
                        class_slug=class_slug,
                    )
                )
    except Exception:
        logger.exception("Failed reading PDF %s", pdf_path)
        return []

    if not chunks:
        # Empty / image-only PDF: still register so callers know a source exists.
        chunks.append(
            _Chunk(
                source=pdf_path.name,
                page_or_section=None,
                passage="[PDF present but no extractable text]",
                disease_class=disease_class,
                class_slug=class_slug,
            )
        )
    return chunks


def _score_chunk(chunk: _Chunk, query_tokens: set[str]) -> float:
    if not query_tokens:
        return 0.0
    passage_tokens = _tokenize(chunk.passage)
    if not passage_tokens:
        return 0.0
    overlap = len(query_tokens & passage_tokens)
    # Prefer denser overlap; light boost when class tokens appear.
    density = overlap / max(len(query_tokens), 1)
    class_boost = 0.15 if query_tokens & _tokenize(chunk.disease_class) & passage_tokens else 0.0
    return density + class_boost


def _load_class_chunks(
    disease_class: str,
    rag_pdf_dir: str | None = None,
) -> list[_Chunk]:
    folder = _class_dir(disease_class, rag_pdf_dir)
    if folder is None:
        return []

    slug = folder.name
    if not folder.is_dir():
        logger.info("No RAG folder for class %r at %s", disease_class, folder)
        return []

    pdfs = sorted(p for p in folder.glob("*.pdf") if p.is_file())
    if not pdfs:
        logger.info("No PDFs under %s", folder)
        return []

    chunks: list[_Chunk] = []
    for pdf in pdfs:
        chunks.extend(
            _extract_pdf_chunks(pdf, disease_class=disease_class.strip(), class_slug=slug)
        )
    return chunks


def retrieve_citations(
    disease_class: str,
    rag_pdf_dir: str | None = None,
    *,
    query: str | None = None,
    top_k: int = _DEFAULT_TOP_K,
    extra_classes: Iterable[str] | None = None,
) -> list[dict[str, Any]]:
    """Return Nest-compatible citation dicts for PDFs under class slug folders.

    Missing directory or zero PDFs → empty list (no fake medical text).
    When extractable text exists, returns top_k ranked chunks for the query
    (defaults to the class name). Swap later for LlamaIndex without changing
    the Nest contract.
    """
    classes: list[str] = []
    for name in (disease_class, *(extra_classes or ())):
        cleaned = (name or "").strip()
        if cleaned and cleaned not in classes:
            classes.append(cleaned)

    all_chunks: list[_Chunk] = []
    for name in classes:
        all_chunks.extend(_load_class_chunks(name, rag_pdf_dir))

    if not all_chunks:
        return []

    query_text = (query or " ".join(classes)).strip()
    query_tokens = _tokenize(query_text)

    ranked = sorted(
        (
            (_score_chunk(chunk, query_tokens), idx, chunk)
            for idx, chunk in enumerate(all_chunks)
        ),
        key=lambda item: (-item[0], item[1]),
    )

    citations: list[dict[str, Any]] = []
    for score, _, chunk in ranked[: max(1, top_k)]:
        citations.append(
            {
                "source": chunk.source,
                "page_or_section": chunk.page_or_section,
                "passage": chunk.passage,
                "relevance_score": round(float(score), 4) if score else None,
            }
        )
    return citations
