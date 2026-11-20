"""Class-aligned RAG + Claude Sonnet diagnosis for Nest POST /diagnose.

Without ANTHROPIC_API_KEY (or on Claude failure): structured stub, model "stub".
With key + successful call: grounded narrative, model "claude-sonnet-4-20250514".
Missing PDFs never crash — empty citations + grounded/stub message.
"""

from __future__ import annotations

import logging
from typing import Any, Iterable

from app.core.config import settings
from app.services.rag_retriever import retrieve_citations

logger = logging.getLogger(__name__)

CLAUDE_MODEL = "claude-sonnet-4-20250514"
_MAX_DETECTION_LINES = 24
_MAX_PASSAGE_CHARS = 900


def diagnose(
    disease_class: str,
    image_id: str | None = None,
    *,
    detections: list[dict[str, Any]] | None = None,
    rag_pdf_dir: str | None = None,
    anthropic_api_key: str | None = None,
) -> dict[str, Any]:
    """Return { diagnosis, citations[], model } for POST /diagnose."""
    _ = image_id  # reserved for grounded multimodal calls later

    det_list = list(detections or [])
    extra_classes = _unique_classes(disease_class, det_list)
    query = _build_query(disease_class, det_list)
    citations = retrieve_citations(
        disease_class,
        rag_pdf_dir=rag_pdf_dir,
        query=query,
        extra_classes=extra_classes[1:] if len(extra_classes) > 1 else None,
    )

    api_key = (
        anthropic_api_key
        if anthropic_api_key is not None
        else settings.anthropic_api_key
    ).strip()

    if not api_key:
        return _stub_diagnosis(disease_class, citations, det_list)

    try:
        text = _claude_diagnosis(
            api_key=api_key,
            disease_class=disease_class,
            detections=det_list,
            citations=citations,
        )
        return {
            "diagnosis": text,
            "citations": citations,
            "model": CLAUDE_MODEL,
        }
    except Exception:
        logger.exception(
            "Claude diagnosis failed for class %r; falling back to stub",
            disease_class,
        )
        return _stub_diagnosis(disease_class, citations, det_list)


def _unique_classes(
    primary: str,
    detections: Iterable[dict[str, Any]],
) -> list[str]:
    out: list[str] = []
    for name in (primary, *(str(d.get("class") or "") for d in detections)):
        cleaned = name.strip()
        if cleaned and cleaned not in out:
            out.append(cleaned)
    return out


def _build_query(disease_class: str, detections: list[dict[str, Any]]) -> str:
    parts = [disease_class.strip()] if disease_class.strip() else []
    for det in detections[:_MAX_DETECTION_LINES]:
        label = str(det.get("class") or "").strip()
        if label and label not in parts:
            parts.append(label)
    return " ".join(parts)


def _stub_diagnosis(
    disease_class: str,
    citations: list[dict[str, Any]],
    detections: list[dict[str, Any]],
) -> dict[str, Any]:
    n = len(citations)
    det_n = len(detections)
    if n == 0:
        note = (
            f"Structured stub for class '{disease_class}'"
            + (f" ({det_n} detection(s))" if det_n else "")
            + ". No class-aligned PDF passages found under RAG_PDF_DIR. "
            "Drop clinical PDFs into RAG_PDF_DIR/<class_slug>/*.pdf "
            "(see ml-service/rag/pdfs/README.md) and set ANTHROPIC_API_KEY "
            "for grounded Claude diagnosis."
        )
    else:
        note = (
            f"Structured stub for class '{disease_class}' "
            f"with {n} retrieved passage(s)"
            + (f" and {det_n} detection(s)" if det_n else "")
            + ". ANTHROPIC_API_KEY missing or Claude unavailable — "
            "citations are returned without LLM narrative."
        )
    return {
        "diagnosis": note,
        "citations": citations,
        "model": "stub",
    }


def _format_detections(detections: list[dict[str, Any]]) -> str:
    if not detections:
        return "(none)"
    lines: list[str] = []
    for det in detections[:_MAX_DETECTION_LINES]:
        label = str(det.get("class") or "unknown")
        conf = det.get("confidence")
        conf_s = f"{float(conf):.3f}" if conf is not None else "?"
        bbox = det.get("bbox")
        bbox_s = ""
        if isinstance(bbox, list) and len(bbox) == 4:
            bbox_s = f" bbox=[{', '.join(f'{float(v):.1f}' for v in bbox)}]"
        lines.append(f"- {label} (conf={conf_s}){bbox_s}")
    if len(detections) > _MAX_DETECTION_LINES:
        lines.append(f"- … {len(detections) - _MAX_DETECTION_LINES} more")
    return "\n".join(lines)


def _format_citations(citations: list[dict[str, Any]]) -> str:
    if not citations:
        return "(no retrieved passages — reason from detections and class only; state uncertainty)"
    blocks: list[str] = []
    for i, cite in enumerate(citations, start=1):
        passage = str(cite.get("passage") or "")[:_MAX_PASSAGE_CHARS]
        loc = cite.get("page_or_section") or "n/a"
        blocks.append(
            f"[{i}] source={cite.get('source')} section={loc}\n{passage}"
        )
    return "\n\n".join(blocks)


def _claude_diagnosis(
    *,
    api_key: str,
    disease_class: str,
    detections: list[dict[str, Any]],
    citations: list[dict[str, Any]],
) -> str:
    import anthropic

    system = (
        "You are a dental radiology assistant for panoramic radiographs. "
        "Write a concise clinical-style finding summary grounded ONLY on the "
        "YOLO detections and retrieved reference passages provided. "
        "Do not invent anatomy, pathology, or citations. "
        "If passages are missing or thin, say so and keep claims provisional. "
        "This is decision support, not a final diagnosis — recommend clinician review. "
        "Use clear paragraphs; no markdown tables."
    )
    user = (
        f"Primary predicted class: {disease_class}\n\n"
        f"YOLO detections:\n{_format_detections(detections)}\n\n"
        f"Retrieved class-aligned passages:\n{_format_citations(citations)}\n\n"
        "Produce a short grounded diagnosis narrative for the clinician UI."
    )

    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": user}],
    )

    parts: list[str] = []
    for block in message.content:
        text = getattr(block, "text", None)
        if text:
            parts.append(text)
    joined = "\n".join(parts).strip()
    if not joined:
        raise RuntimeError("Claude returned empty content")
    return joined
