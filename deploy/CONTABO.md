# Contabo deploy — Dental NEU AI

Target VPS (Hamza): **vmi3786753** · `root@13.140.160.31` · SSH port **22** · Linux (Ubuntu).

## Stack

| Service | Role | Port (internal) |
| --- | --- | --- |
| `proxy` (nginx) | Edge HTTP | **80** public |
| `frontend` | Next.js | 3041 |
| `backend` | NestJS | 3000 |
| `postgres` | DB on VPS | 5432 (not published) |
| `ml-service` | Optional FastAPI (`--profile ml`) | 8000 |

Live URLs (after deploy):

- UI: `http://13.140.160.31/`
- Health: `http://13.140.160.31/api/health`
- Health + DB: `http://13.140.160.31/api/health?db=true`

## SSH from this Windows PC

Preferred IdentityFile (after Contabo has **this** pubkey + Reset credentials):

```text
C:\Users\micro\.ssh\cursor-agent-contabo-deploy
```

Public key to place in Contabo panel (name e.g. `cursor-agent-deploy`):

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICu7GbskzgFdeu2IajCPx4N9Wf7cZZefzrZNyX3e6qca cursor-agent-contabo-deploy
```

Fingerprint: `SHA256:XYoSmxtxPdKg1hjVem8R+gL/WdRItnxL3lq1fMIGg00`

```powershell
ssh -i C:\Users\micro\.ssh\cursor-agent-contabo-deploy -o IdentitiesOnly=yes root@13.140.160.31
```

If Contabo still has an older panel key whose **private** key is not on this PC, SSH will fail. Fix: replace/add the pubkey above in Contabo → **Reset credentials** → wait 1–2 minutes → retry. Do not invent passwords; if using password auth, confirm the exact string in Contabo after Reset credentials.

## Server install (once SSH works)

```bash
# Docker Engine + Compose plugin
apt-get update && apt-get install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sh

git clone https://github.com/Haseebcodejourney/dental-neu-ai.git /opt/dental-neu-ai
cd /opt/dental-neu-ai
git checkout <deploy-branch-or-main>

cp deploy/.env.prod.example deploy/.env.prod
# edit deploy/.env.prod — set POSTGRES_PASSWORD and CORS_ORIGINS

docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d --build
```

Contabo firewall: allow **TCP 22** and **TCP 80** (443 later for HTTPS).

### Optional ML service

Copy `dental-yolo.pt` to the server (not in git), e.g. `/opt/dental-neu-ai/ml-service/models/dental-yolo.pt`, then:

```bash
# in deploy/.env.prod
# ML_MODELS_HOST_PATH=/opt/dental-neu-ai/ml-service/models

docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod --profile ml up -d --build
```

## Health checks

```bash
curl -sS http://127.0.0.1/api/health
curl -sS http://127.0.0.1/api/health?db=true
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
```

## Secrets policy

- Never commit `deploy/.env.prod`, `.env`, `.env.local`, or `*.pt`
- Aurora/RDS passwords stay out of git; Contabo compose uses local Postgres by default
