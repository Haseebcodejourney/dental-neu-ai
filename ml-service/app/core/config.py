import os


class Settings:
    """Env-driven settings for the ML service."""

    port: int = int(os.getenv("PORT", "8000"))
    yolo_model_path: str = os.getenv("YOLO_MODEL_PATH", "")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    rag_pdf_dir: str = os.getenv("RAG_PDF_DIR", "./data/pdfs")


settings = Settings()
