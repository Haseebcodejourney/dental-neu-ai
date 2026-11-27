# FastAPI ML service (optional on Contabo). YOLO .pt weights are NOT in git —
# mount or copy models/dental-yolo.pt onto the server separately.
FROM python:3.11-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY rag ./rag
COPY data ./data

# models/ may be empty in the image; bind-mount weights at runtime
RUN mkdir -p models

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
