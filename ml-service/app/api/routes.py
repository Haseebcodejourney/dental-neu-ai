from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel, ConfigDict, Field

from app.services.yolo_classifier import get_classifier

router = APIRouter()


class Detection(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)

    class_: str = Field(alias="class")
    confidence: float
    bbox: list[float] = Field(
        description="Absolute xyxy pixel coords [x1, y1, x2, y2]",
    )


class ClassifyResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)

    class_: str = Field(alias="class")
    confidence: float
    model: str
    detections: list[Detection] = Field(default_factory=list)


class DiagnoseRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    class_: str = Field(alias="class")
    image_id: str | None = None


class Citation(BaseModel):
    source: str
    page_or_section: str | None = None
    passage: str
    relevance_score: float | None = None


class DiagnoseResponse(BaseModel):
    diagnosis: str
    citations: list[Citation]
    model: str


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/classify", response_model=ClassifyResponse)
async def classify(image: UploadFile = File(...)) -> ClassifyResponse:
    """CV classification via Ultralytics YOLO, or stub when no model is configured."""
    image_bytes = await image.read()
    result = get_classifier().classify(image_bytes)
    return ClassifyResponse.model_validate(result)


@router.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose(body: DiagnoseRequest) -> DiagnoseResponse:
    """Stub class-aligned RAG + Claude. Wire RAG_PDF_DIR + ANTHROPIC_API_KEY later."""
    disease = body.class_
    return DiagnoseResponse(
        diagnosis=(
            f"Stub diagnosis for class '{disease}'. "
            "Replace with class-aligned RAG retrieval and Claude Sonnet."
        ),
        citations=[
            Citation(
                source=f"{disease}.pdf",
                page_or_section="1",
                passage=f"Placeholder passage for class '{disease}'.",
                relevance_score=0.0,
            )
        ],
        model="claude-stub",
    )
