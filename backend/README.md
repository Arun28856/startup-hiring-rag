# Backend — Startup Hiring & Salary Intelligence API

NestJS REST API that acts as the gateway between the frontend and the Python embeddings microservice.

## Prerequisites

- Node.js 18+
- Python embeddings service running on port 8000 (see `../embeddings-service/README.md`)
- Ollama with `mistral` model running locally

## Setup

```bash
npm install
```

## Running

```bash
# Development (hot-reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API listens on **http://localhost:3001**.

---

## Endpoints

### GET /health

Returns service health status.

```bash
curl http://localhost:3001/health
```

Response `200`:
```json
{
  "status": "ok",
  "timestamp": "2026-06-19T14:30:00.000Z"
}
```

---

### POST /ingest

Ingest a document into the vector store.

```bash
curl -X POST http://localhost:3001/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "startup_roles.md",
    "content": "# Engineering\n\n## Backend Engineer\n\nSalary range: 15-25 LPA",
    "mimeType": "text/markdown"
  }'
```

Request body:

| Field      | Type   | Required | Description                                           |
|------------|--------|----------|-------------------------------------------------------|
| filename   | string | Yes      | Original filename (used as metadata)                  |
| content    | string | Yes      | Document text content                                 |
| mimeType   | string | Yes      | One of: `text/plain`, `text/markdown`, `application/pdf` |

Response `201`:
```json
{
  "message": "Ingested successfully",
  "chunksStored": 4
}
```

Response `400` - validation error:
```json
{
  "statusCode": 400,
  "message": ["mimeType must be one of the following values: text/plain, text/markdown, application/pdf"],
  "error": "Bad Request"
}
```

Response `503` - Python service unreachable:
```json
{
  "statusCode": 503,
  "message": "Embeddings service is unreachable. Please ensure the Python service is running on port 8000."
}
```

---

### POST /query

Query the RAG pipeline with a natural language question.

```bash
curl -X POST http://localhost:3001/query \
  -H "Content-Type: application/json" \
  -d '{ "question": "What is the salary range for a backend engineer at an Indian startup?" }'
```

Request body:

| Field    | Type   | Required | Description                         |
|----------|--------|----------|-------------------------------------|
| question | string | Yes      | Natural language question (min 3 chars) |

Response `200`:
```json
{
  "answer": "Backend engineers at Indian startups typically earn between 15 and 25 LPA...",
  "sources": [
    {
      "content": "## Backend Engineer\n\nSalary: 15-25 LPA",
      "metadata": {
        "role_title": "Backend Engineer",
        "role_category": "Engineering",
        "source": "startup_hiring_salary_data.md"
      }
    }
  ]
}
```

Response `400` - validation error:
```json
{
  "statusCode": 400,
  "message": ["question must be longer than or equal to 3 characters"],
  "error": "Bad Request"
}
```

Response `503` - Python service unreachable:
```json
{
  "statusCode": 503,
  "message": "Embeddings service is unreachable. Please ensure the Python service is running on port 8000."
}
```

---

## Running Tests

```bash
# Unit tests
npm run test

# E2E tests (does not require Python service - HttpService is mocked)
npm run test:e2e

# Coverage
npm run test:cov
```

---

## Architecture

```
Frontend (port 3000)
       |
       v
NestJS Backend (port 3001)
  - /health      -> HealthController (no external deps)
  - /ingest      -> IngestController -> IngestService -> HTTP -> FastAPI :8000/ingest
  - /query       -> QueryController  -> QueryService  -> HTTP -> FastAPI :8000/query
       |
       v
FastAPI Embeddings Service (port 8000)
  - POST /ingest  -> LangChain chunker -> HuggingFace embeddings -> ChromaDB
  - POST /query   -> ChromaDB retriever -> Ollama (mistral) -> answer
       |
       v
ChromaDB (./chroma_db)  +  Ollama (mistral)
```
