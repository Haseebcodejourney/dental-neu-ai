"""Ultralytics YOLO classifier with graceful stub fallback."""

from __future__ import annotations

import io
import logging
from pathlib import Path
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

STUB_RESULT: dict[str, Any] = {
    "class": "placeholder_class",
    "confidence": 0.0,
    "model": "stub",
    "detections": [],
}


class YoloClassifier:
    """Loads a YOLO .pt from YOLO_MODEL_PATH, or serves a structured stub."""

    def __init__(
        self,
        model_path: str | None = None,
        confidence: float | None = None,
        device: str | None = None,
    ) -> None:
        self.model_path = (model_path if model_path is not None else settings.yolo_model_path).strip()
        self.confidence = (
            confidence if confidence is not None else settings.yolo_confidence
        )
        self.device = (device if device is not None else settings.device).strip() or "cpu"
        self._model: Any | None = None
        self._model_name = "stub"
        self._load()

    def _load(self) -> None:
        if not self.model_path:
            logger.info("YOLO_MODEL_PATH unset; using stub classifier")
            return

        path = Path(self.model_path)
        if not path.is_file():
            logger.warning(
                "YOLO_MODEL_PATH %s not found; using stub classifier", self.model_path
            )
            return

        try:
            from ultralytics import YOLO

            self._model = YOLO(str(path))
            self._model_name = path.name
            logger.info("Loaded YOLO model from %s (device=%s)", path, self.device)
        except Exception:
            logger.exception(
                "Failed to load YOLO model from %s; using stub classifier",
                self.model_path,
            )
            self._model = None
            self._model_name = "stub"

    @property
    def is_stub(self) -> bool:
        return self._model is None

    def classify(self, image_bytes: bytes) -> dict[str, Any]:
        """Run inference; returns Nest-compatible {class, confidence, model, detections}."""
        if self._model is None:
            return dict(STUB_RESULT)

        try:
            results = self._model.predict(
                source=io.BytesIO(image_bytes),
                conf=self.confidence,
                device=self.device,
                verbose=False,
            )
            return self._parse_results(results)
        except Exception:
            logger.exception("YOLO inference failed; returning stub")
            return dict(STUB_RESULT)

    def _parse_results(self, results: list[Any]) -> dict[str, Any]:
        if not results:
            return {
                "class": "unknown",
                "confidence": 0.0,
                "model": self._model_name,
                "detections": [],
            }

        result = results[0]
        detections: list[dict[str, Any]] = []

        # Detection / segmentation boxes
        if getattr(result, "boxes", None) is not None and len(result.boxes) > 0:
            names = result.names or {}
            for box in result.boxes:
                cls_id = int(box.cls.item())
                conf = float(box.conf.item())
                label = names.get(cls_id, str(cls_id))
                xyxy = [float(v) for v in box.xyxy[0].tolist()]
                detections.append(
                    {
                        "class": label,
                        "confidence": conf,
                        "bbox": xyxy,
                    }
                )
            top = max(detections, key=lambda d: d["confidence"])
            return {
                "class": top["class"],
                "confidence": top["confidence"],
                "model": self._model_name,
                "detections": detections,
            }

        # Classification head (probs)
        if getattr(result, "probs", None) is not None:
            probs = result.probs
            top1 = int(probs.top1)
            conf = float(probs.top1conf)
            names = result.names or {}
            label = names.get(top1, str(top1))
            return {
                "class": label,
                "confidence": conf,
                "model": self._model_name,
                "detections": [],
            }

        return {
            "class": "unknown",
            "confidence": 0.0,
            "model": self._model_name,
            "detections": [],
        }


_classifier: YoloClassifier | None = None


def get_classifier() -> YoloClassifier:
    """Process-wide singleton so the .pt is loaded once."""
    global _classifier
    if _classifier is None:
        _classifier = YoloClassifier()
    return _classifier
