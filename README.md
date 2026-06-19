# Hiring Intel — Startup RAG Pipeline

A full-stack RAG (Retrieval-Augmented Generation) app for querying startup hiring and salary data in the Indian market. Ask questions in natural language; the system retrieves relevant context from your documents and generates answers with Groq's LLM API.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Zustand, Framer Motion |
| Backend | NestJS (REST API proxy) |
| Embeddings service | FastAPI + LangChain + ChromaDB |
| LLM | `llama-3.1-8b-instant` via Groq API (free) |
| Embeddings model | `all-MiniLM-L6-v2` (HuggingFace, runs locally) |
| Vector store | ChromaDB (persisted locally) |

## Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- A free [Groq API key](https://console.groq.com)

### 1. Clone & configure
```bash
git clone https://github.com/YOUR_USERNAME/startup-hiring-rag.git
cd startup-hiring-rag
cp .env.example .env          # then add your GROQ_API_KEY
```

### 2. Python (embeddings service)
```bash
pip install -r embeddings-service/requirements.txt
```

### 3. Backend (NestJS)
```bash
cd backend
npm install
```

### 4. Frontend (Next.js)
```bash
cd frontend
npm install
```

## Running

Open three terminals from the project root:

```bash
# Terminal 1 — Embeddings service (port 8000)
uvicorn embeddings-service.main:app --reload --port 8000

# Terminal 2 — NestJS backend (port 3001)
cd backend && npm run start:dev

# Terminal 3 — Next.js frontend (port 3000)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Ingest data

Go to the **Upload Data** page and upload `.txt` or `.md` files. A sample dataset is included at `data/startup_hiring_salary_data.md`.

You can also ingest via script:
```bash
python ingest.py
```

## API

| Method | Path | Description |
|---|---|---|
| POST | `/query` | Ask a question → `{ answer, sources }` |
| POST | `/ingest` | Upload a document → `{ message, chunksStored }` |
| GET | `/health` | Health check |

## Features

- Dark / light mode toggle
- Markdown rendering in AI responses
- Collapsible sources panel per answer
- Example prompts on empty state
- Drag-and-drop file upload
