# Deployment Guide — RAG Pipeline

## Architecture Overview

```
Browser → [Frontend: Next.js]
               │
               ▼
        [Backend: NestJS]  ←──  EMBEDDINGS_SERVICE_URL
               │
               ▼
   [Embeddings: FastAPI + ChromaDB]
               │
               ▼
         [Groq API (LLM)]
```

Three services are deployed independently on Railway and wired together via environment variables.

---

## Recommended: Railway

Railway is the best fit for this stack — it supports monorepos with multiple services, handles Node.js and Python automatically via Nixpacks (no Dockerfiles needed), and provides persistent volumes for ChromaDB.

**Estimated cost:** Free Hobby tier covers light usage; ~$5/month for always-on.

---

## Pre-Deployment Checklist

- [ ] Rotate your Groq API key at https://console.groq.com (the current key in `.env` should be treated as compromised since it lived in the working directory)
- [ ] Push this repo to GitHub (Railway deploys from a GitHub repo)
- [ ] Have your new Groq API key ready

---

## Step-by-Step: Deploy on Railway

### 1. Create a Railway project

1. Sign up at [railway.app](https://railway.app) and create a new project
2. Choose **"Deploy from GitHub repo"** and connect your repository

---

### 2. Add the Embeddings Service (FastAPI)

1. In your Railway project, click **"+ New Service"** → **"GitHub Repo"**
2. Select your repo and set the **Root Directory** to `embeddings-service`
3. Railway auto-detects Python via Nixpacks and uses `embeddings-service/railway.toml`
4. Add environment variables under **Variables**:

| Variable | Value |
|----------|-------|
| `GROQ_API_KEY` | your new Groq API key |

5. Under **Volumes**, add a persistent volume:
   - Mount path: `/app/chroma_db`
   - This keeps your ChromaDB data across redeploys

6. Deploy and copy the **public URL** (e.g., `https://embeddings-xxx.railway.app`)

---

### 3. Add the Backend Service (NestJS)

1. Click **"+ New Service"** → **"GitHub Repo"**
2. Select your repo and set the **Root Directory** to `backend`
3. Add environment variables:

| Variable | Value |
|----------|-------|
| `EMBEDDINGS_SERVICE_URL` | Internal Railway URL of embeddings service (e.g., `https://embeddings-xxx.railway.app`) |
| `CORS_ORIGIN` | Railway frontend URL — add this after step 4 (e.g., `https://frontend-xxx.railway.app`) |

4. Deploy and copy the **public URL** (e.g., `https://backend-xxx.railway.app`)

---

### 4. Add the Frontend Service (Next.js)

1. Click **"+ New Service"** → **"GitHub Repo"**
2. Select your repo and set the **Root Directory** to `frontend`
3. Add environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_BACKEND_URL` | Railway backend URL from step 3 (e.g., `https://backend-xxx.railway.app`) |

> **Important:** `NEXT_PUBLIC_BACKEND_URL` is embedded at **build time** in Next.js.  
> After adding it, trigger a redeploy of the frontend service so it picks up the value.

4. Deploy — your frontend is now live at the Railway URL

---

### 5. Wire up CORS (final step)

1. Go back to the **Backend** service → **Variables**
2. Set `CORS_ORIGIN` to the frontend Railway URL from step 4
3. Redeploy the backend

---

## Environment Variables Reference

### Embeddings Service (`embeddings-service/`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API key for LLM inference |
| `PORT` | Auto | Injected by Railway — do not set manually |

### Backend (`backend/`)

| Variable | Required | Description |
|----------|----------|-------------|
| `EMBEDDINGS_SERVICE_URL` | Yes | Full URL of the embeddings service |
| `CORS_ORIGIN` | Yes | URL of the frontend (allows CORS) |
| `PORT` | Auto | Injected by Railway — do not set manually |

### Frontend (`frontend/`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | Yes | Full URL of the NestJS backend |

---

## ChromaDB Persistence

ChromaDB stores its data in `chroma_db/` (SQLite). On Railway, this directory is ephemeral unless you attach a **Volume**. Without a volume, all ingested documents are lost on every redeploy.

- **For demo/testing:** ephemeral is fine — re-ingest documents after each deploy
- **For persistent demo:** attach a Railway volume mounted at `/app/chroma_db` on the embeddings service

---

## Why Not the Other Options?

| Platform | Why skipped |
|----------|-------------|
| **Render** | Free tier has cold starts (30s+ spin-up); the ML embedding model makes cold starts very painful |
| **Docker + VPS (DigitalOcean/AWS)** | Overkill for a learning project; requires writing Dockerfiles + managing infrastructure |

---

## After Deploying

1. Visit the frontend URL
2. Go to `/ingest` and upload `data/startup_hiring_salary_data.md`
3. Go back to `/` and ask a question like: *"What is the salary range for a Senior Backend Engineer?"*
4. Check the Railway logs for each service if something isn't working

---

## Dependency Updates (Recommended Before Deploy)

The security audit flagged outdated dependencies. Run these before pushing:

```bash
# Frontend — update Next.js (has multiple CVEs in 14.2.3)
cd frontend && npm install next@latest

# Backend — update multer (DoS vulnerabilities, transitive via @nestjs/platform-express)
cd backend && npm audit fix
```
