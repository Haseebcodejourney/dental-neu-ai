"""Class-aligned RAG diagnosis for Nest POST /diagnose.

Default backend is **local**: grounded text from our trained YOLO detections
+ retrieved PDF passages (no cloud LLM). Optional DIAGNOSIS_BACKEND=anthropic
keeps Claude as an opt-in only.

Missing PDFs never crash — returns a structured local note with empty citations.
"""

from __future__ import annotations

import logging
from typing import Any, Iterable

from app.core.config import settings
from app.services.rag_retriever import retrieve_citations

logger = logging.getLogger(__name__)

LOCAL_MODEL = "dental-yolo+rag"
CLAUDE_MODEL = "claude-sonnet-4-20250514"
_MAX_DETECTION_LINES = 24
_MAX_PASSAGE_CHARS = 500


def diagnose(
    disease_class: str,
    image_id: str | None = None,
    *,
    detections: list[dict[str, Any]] | None = None,
    rag_pdf_dir: str | None = None,
    anthropic_api_key: str | None = None,
    diagnosis_backend: str | None = None,
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

    backend = (
        diagnosis_backend
        if diagnosis_backend is not None
        else settings.diagnosis_backend
    ).strip().lower() or "local"

    if backend == "anthropic":
        return _anthropic_or_local(
            disease_class=disease_class,
            detections=det_list,
            citations=citations,
            anthropic_api_key=anthropic_api_key,
        )

    # Default / unknown backends → local (own YOLO + RAG).
    if backend not in {"local", "yolo", "rag", "dental-yolo+rag"}:
        logger.warning("Unknown DIAGNOSIS_BACKEND %r; using local", backend)

    text = _local_diagnosis(disease_class, det_list, citations)
    return {
        "diagnosis": text,
        "citations": citations,
        "model": LOCAL_MODEL,
    }


def _anthropic_or_local(
    *,
    disease_class: str,
    detections: list[dict[str, Any]],
    citations: list[dict[str, Any]],
    anthropic_api_key: str | None,
) -> dict[str, Any]:
    api_key = (
        anthropic_api_key
        if anthropic_api_key is not None
        else settings.anthropic_api_key
    ).strip()

    if not api_key:
        logger.info("DIAGNOSIS_BACKEND=anthropic but no API key; using local")
        return {
            "diagnosis": _local_diagnosis(disease_class, detections, citations),
            "citations": citations,
            "model": LOCAL_MODEL,
        }

    try:
        text = _claude_diagnosis(
            api_key=api_key,
            disease_class=disease_class,
            detections=detections,
            citations=citations,
        )
        return {
            "diagnosis": text,
            "citations": citations,
            "model": CLAUDE_MODEL,
        }
    except Exception:
        logger.exception(
            "Claude diagnosis failed for class %r; falling back to local",
            disease_class,
        )
        return {
            "diagnosis": _local_diagnosis(disease_class, detections, citations),
            "citations": citations,
            "model": LOCAL_MODEL,
        }


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


def _local_diagnosis(
    disease_class: str,
    detections: list[dict[str, Any]],
    citations: list[dict[str, Any]],
) -> str:
    """Grounded narrative from our YOLO labels + class-aligned RAG (no cloud LLM)."""
    primary = (disease_class or "unknown").strip() or "unknown"
    parts: list[str] = [
        f"Local diagnosis from trained dental YOLO + class-aligned RAG.",
        f"Primary predicted class: {primary}.",
    ]

    if detections:
        lines: list[str] = []
        for det in detections[:_MAX_DETECTION_LINES]:
            label = str(det.get("class") or "unknown")
            conf = det.get("confidence")
            conf_s = f"{float(conf) * 100:.1f}%" if conf is not None else "?"
            lines.append(f"- {label} ({conf_s})")
        if len(detections) > _MAX_DETECTION_LINES:
            lines.append(f"- … {len(detections) - _MAX_DETECTION_LINES} more")
        parts.append("Detections:\n" + "\n".join(lines))
    else:
        parts.append(
            "No bounding-box detections were returned; "
            "the primary class alone drives this note."
        )

    usable = [
        c
        for c in citations
        if str(c.get("passage") or "").strip()
        and not str(c.get("passage") or "").startswith("[PDF")
    ]
    if usable:
        blocks: list[str] = []
        for i, cite in enumerate(usable[:5], start=1):
            passage = str(cite.get("passage") or "")[:_MAX_PASSAGE_CHARS].strip()
            loc = cite.get("page_or_section") or "n/a"
            src = cite.get("source") or "unknown"
            blocks.append(f"[{i}] {src} ({loc}): {passage}")
        parts.append(
            "Retrieved reference passages for the predicted class(es):\n"
            + "\n".join(blocks)
        )
        parts.append(
            "Interpretation is limited to the detections and passages above. "
            "This is decision support for clinician review, not a final diagnosis."
        )
    else:
        parts.append(
            "No class-aligned PDF passages were found under RAG_PDF_DIR. "
            f"Drop clinical PDFs into RAG_PDF_DIR/<class_slug>/ "
            f"(e.g. for '{primary}') — see ml-service/rag/pdfs/README.md. "
            "Until then, this note is based only on the YOLO prediction."
        )

    return "\n\n".join(parts)


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
        passage = str(cite.get("passage") or "")[:900]
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
    """Opt-in Anthropic path only when DIAGNOSIS_BACKEND=anthropic."""
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
