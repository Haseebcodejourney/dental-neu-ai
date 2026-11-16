from fastapi import FastAPI

from app.api.routes import router
from app.core.config import settings

app = FastAPI(title="Dental NEU AI — ML Service", version="0.1.0")
app.include_router(router)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "dental-neu-ai-ml", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True)
