from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel, ConfigDict, Field

from app.services.diagnoser import diagnose as run_diagnose
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
    """Class-aligned RAG lookup + stub diagnosis (Claude TODO when key + corpus ready)."""
    result = run_diagnose(body.class_, body.image_id)
    return DiagnoseResponse.model_validate(result)
