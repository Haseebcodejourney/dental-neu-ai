import os
from pathlib import Path

from dotenv import load_dotenv

# Load ml-service/.env when present (does not override already-set process env).
load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class Settings:
    """Env-driven settings for the ML service."""

    port: int = int(os.getenv("PORT", "8000"))
    yolo_model_path: str = os.getenv("YOLO_MODEL_PATH", "")
    yolo_confidence: float = float(os.getenv("YOLO_CONFIDENCE", "0.25"))
    device: str = os.getenv("DEVICE", "cpu")
    # local (default) = own dental-yolo + class-aligned RAG; anthropic = opt-in only
    diagnosis_backend: str = os.getenv("DIAGNOSIS_BACKEND", "local")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    # Class-aligned PDFs live under RAG_PDF_DIR/<class_slug>/*.pdf
    # Default: ml-service/rag/pdfs (see rag/pdfs/README.md).
    rag_pdf_dir: str = os.getenv("RAG_PDF_DIR", "./rag/pdfs")


settings = Settings()
