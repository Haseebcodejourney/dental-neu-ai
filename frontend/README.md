# Dental NEU AI — Frontend

Next.js (App Router) diagnose UI: upload a panoramic → Nest `POST /api/diagnosis/run` → show top class, detections, and local YOLO+RAG diagnosis text.

## Run

Requires Nest on `:3000` and ml-service on `:8000`.

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev                  # http://localhost:3041
```

Dev server defaults to **3041** to avoid common collisions with other apps on 3000/3001.

Point `NEXT_PUBLIC_API_URL` at whatever port Nest is using (`PORT` in `backend/.env`; docs default `3000`).

## Env

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Nest API origin (no trailing slash) |

Do not put secrets in the frontend env — only the public API base URL.
