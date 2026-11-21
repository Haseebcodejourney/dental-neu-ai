"""YOLO class names ↔ filesystem slugs for class-aligned RAG.

Names match the dental-yolo.pt / legend labels exactly (including
'Bone resorbtion' spelling as shipped in the weight).
"""

from __future__ import annotations

import re

# Display labels as predicted by dental-yolo.pt (order matches training legend).
YOLO_CLASS_NAMES: tuple[str, ...] = (
    "Implant",
    "Prosthetic restoration",
    "Obturation",
    "Endodontic treatment",
    "Carious lesion",
    "Bone resorbtion",
    "Impacted tooth",
    "Apical periodontitis",
    "Root fragment",
    "Furcation lesion",
    "Apical surgery",
    "Root resorption",
    "Orthodontic device",
    "Surgical device",
)

_SPACE_RE = re.compile(r"[\s_]+")
_NON_SLUG_RE = re.compile(r"[^a-z0-9\-]+")


def class_slug(name: str) -> str:
    """Normalize a predicted class label to a folder-safe slug."""
    raw = (name or "").strip().lower()
    raw = _SPACE_RE.sub("-", raw)
    raw = _NON_SLUG_RE.sub("", raw)
    return raw.strip("-")


# Explicit map so legend labels always resolve even if slug rules change later.
CLASS_TO_SLUG: dict[str, str] = {name: class_slug(name) for name in YOLO_CLASS_NAMES}
SLUG_TO_CLASS: dict[str, str] = {slug: name for name, slug in CLASS_TO_SLUG.items()}


def resolve_class_slug(disease_class: str) -> str | None:
    """Return the RAG folder slug for a predicted class, or None if unusable."""
    name = (disease_class or "").strip()
    if not name:
        return None
    if name in CLASS_TO_SLUG:
        return CLASS_TO_SLUG[name]
    slug = class_slug(name)
    return slug or None


def known_class_slugs() -> list[str]:
    return [CLASS_TO_SLUG[n] for n in YOLO_CLASS_NAMES]
