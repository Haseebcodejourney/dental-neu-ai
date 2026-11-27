# Contabo deploy notes — Dental NEU AI

Date: 2026-11-27 (Asia/Nicosia)
Status: **BLOCKED on SSH auth** — host known; credentials not yet accepted by VPS.
Repo: `C:\Users\micro\dental-neu-ai` → https://github.com/Haseebcodejourney/dental-neu-ai
Task: UP-21 Contabo FE+BE deploy and push
MOPG train: not started (out of scope).

## Verdict

VPS identity is known (`vmi3786753` / `13.140.160.31` / `root` / port 22). TCP/22 reachable. OpenSSH on Ubuntu accepts `publickey,password`. **Neither** works yet from this Windows PC:

| Method | Result |
| --- | --- |
| Panel pubkey `cursor-agent-contabo-deploy` (`SHA256:mrMV33…`) | Matching **private** key **not** on this PC |
| Local keys (`id_ed25519`, gitlab, Downloads RSA) | `Permission denied (publickey)` |
| Password supplied by Hamza | `AuthenticationException` (tried literal string and without trailing dots) — no passwords invented |
| New local deploy keypair | Generated; **not yet** installed on Contabo |

Deploy scaffolding is on branch `cursor/contabo-deploy-6752` (Docker Compose + nginx + Dockerfiles). Live URLs pending successful SSH + `docker compose up`.

## Contabo target (Hamza panel)

- Instance: **vmi3786753**
- IPv4: **13.140.160.31**
- User: **root**
- OS: Linux (banner: OpenSSH_9.6p1 Ubuntu)

## Key to install on Contabo (this PC)

Private: `C:\Users\micro\.ssh\cursor-agent-contabo-deploy` (never commit / never paste)

Public (add or replace in Contabo SSH keys, name e.g. `cursor-agent-deploy`):

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICu7GbskzgFdeu2IajCPx4N9Wf7cZZefzrZNyX3e6qca cursor-agent-contabo-deploy
```

Fingerprint: `SHA256:XYoSmxtxPdKg1hjVem8R+gL/WdRItnxL3lq1fMIGg00`

## Exact ask for Hamza

1. Contabo panel → SSH keys → ensure the **public** key above is present (replace the old panel key whose private half is missing on this PC).
2. Click **Reset credentials** once.
3. Wait **1–2 minutes**.
4. Reply here so we retry SSH. If preferring password auth instead: confirm the **exact** root password after Reset credentials (previous attempt was rejected).
5. Contabo firewall: allow **TCP 22** and **TCP 80**.

Optional: confirm whether **ml-service** should run on this VPS (weights exist locally at `ml-service/models/dental-yolo.pt` — copy separately, not via git).

## Deploy scaffolding (ready)

- `deploy/docker-compose.prod.yml` — postgres + backend + frontend + nginx (+ optional `--profile ml`)
- `backend/Dockerfile`, `frontend/Dockerfile`, `ml-service/Dockerfile`
- `deploy/nginx/default.conf` — `/` → Next, `/api/` → Nest
- `deploy/.env.prod.example` — no secrets
- `deploy/CONTABO.md` — runbook
- Nest `CORS_ORIGINS` env; frontend same-origin API base when `NEXT_PUBLIC_API_URL=""`

## Planned live URLs (after deploy)

- `http://13.140.160.31/`
- `http://13.140.160.31/api/health`
- `http://13.140.160.31/api/health?db=true`

## What was not done

- No successful SSH session / no remote install yet
- No MOPG / YOLO training started
- No secrets committed
