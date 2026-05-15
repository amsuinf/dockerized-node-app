# URL Shortener — Dockerized + Auto-Deployed

A small Node.js + Postgres web service used as a reference implementation for a complete, production-style DevOps setup. The app itself is intentionally minimal — the focus is on the infrastructure, container, and CI/CD work around it.

**Live demo:** http://13.53.168.29
**Health endpoint:** http://13.53.168.29/health

---

## What this demonstrates

A pattern I use to take a small web app from "running on my laptop" to "auto-deploys to a real server on every push to main", with sensible defaults a small team can actually maintain.

- **Containerized** with a multi-stage Dockerfile, non-root user, and proper signal handling
- **Orchestrated** locally and in production with `docker compose`
- **Reverse-proxied** behind Nginx with basic rate limiting
- **CI/CD** via GitHub Actions: lint/test → build image → push to GHCR → SSH deploy → health-check
- **Zero-touch deploys** — `git push origin main` is the entire workflow
- **Health checks** at the container, service, and pipeline levels
- **Secrets** managed in GitHub Actions, never committed

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    EC2 (Ubuntu 22.04)                │
│                                                      │
│   ┌─────────┐    ┌──────────┐    ┌────────────┐      │
│   │  Nginx  │───▶│   App    │───▶│  Postgres  │      │
│   │  :80    │    │  :3000   │    │  :5432     │      │
│   └─────────┘    └──────────┘    └────────────┘      │
│        ▲              ▲                ▲             │
│        └──────────────┴────────────────┘             │
│                docker compose                        │
└──────────────────────────────────────────────────────┘
                       ▲
                       │ docker pull from
                       │ ghcr.io
                       │
                ┌──────────────┐
                │ GitHub       │
                │ Actions      │
                │ (build/push) │
                └──────────────┘
                       ▲
                       │ push to main
                       │
                ┌──────────────┐
                │  Developer   │
                └──────────────┘
```

## Pipeline

```
push to main
   │
   ├─▶ Test job (Node 20, jest)
   │
   ├─▶ Build job (only on main)
   │     • docker buildx with layer caching
   │     • push to ghcr.io with :latest and :<sha> tags
   │
   └─▶ Deploy job
         • SSH to EC2
         • docker compose pull && docker compose up -d
         • docker image prune -f
         • curl /health (fails the pipeline if app didn't come up)
```

## Key design decisions

| Decision | Why |
|---|---|
| Multi-stage Dockerfile | Smaller final image (~120MB vs ~400MB), no build tools in production |
| Non-root user inside container | Container breakouts have less blast radius |
| `dumb-init` as PID 1 | Node doesn't handle SIGTERM well as PID 1 — graceful shutdowns matter for zero-downtime |
| GHCR over Docker Hub | Free, no pull rate limits, scoped to the repo |
| SSH-based deploy (not GitOps/k8s) | Right-sized for a single-server app. Anything fancier would be over-engineering |
| Healthcheck endpoint + pipeline curl | Failed deploys fail loudly instead of silently shipping broken code |
| Nginx reverse proxy | TLS termination point when we add HTTPS, plus rate limiting |

## Running locally

```bash
cd app
npm install
npm run dev   # requires a local Postgres OR use docker compose
```

Or with Docker:

```bash
cp .env.example .env
docker compose up --build
```

## Deploying your own copy

1. Fork this repo
2. Provision an Ubuntu 22.04 server (AWS EC2 t2.micro works)
3. SSH in and run `bash scripts/setup-server.sh`
4. Copy `docker-compose.yml`, `nginx/`, and an `.env` file onto the server under `~/app/`
5. In GitHub repo Settings → Secrets, add: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `GHCR_TOKEN`
6. Push to `main`. The pipeline does the rest.

---

Built by [YOUR NAME](https://github.com/YOUR_HANDLE). Available for freelance DevOps work — get in touch.
