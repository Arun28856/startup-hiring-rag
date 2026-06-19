# Embeddings Microservice

FastAPI microservice wrapping the LangChain RAG logic for the Startup Hiring & Salary Intelligence pipeline.

## Prerequisites

- Python 3.10+
- Ollama running locally with the `mistral` model pulled (`ollama pull mistral`)
- ChromaDB already populated (run `python ingest.py` from the repo root first)

## Setup

```bash
# From the embeddings-service/ directory
pip install -r requirements.txt
```

## Running

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

The service will be available at `http://localhost:8000`.

Interactive API docs: `http://localhost:8000/docs`

## Endpoints

### POST /ingest

Ingest a document into ChromaDB.

```bash
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "roles.md",
    "content": "# Engineering\n\n## Backend Engineer\n\nSalary: 15-25 LPA",
    "mime_type": "text/markdown"
  }'
```

Response:
```json
{ "chunks_stored": 1 }
```

### POST /query

Query the RAG pipeline.

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{ "question": "What is the salary range for a backend engineer?" }'
```

Response:
```json
{
  "answer": "...",
  "sources": [
    { "content": "...", "metadata": { "role_title": "Backend Engineer" } }
  ]
}
```

### GET /health

```bash
curl http://localhost:8000/health
```

Response: `{ "status": "ok" }`
