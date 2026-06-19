# Backend QA Review — 2026-06-19

## Passed

- **ValidationPipe registered globally** (`backend/src/main.ts:8-13`) — `whitelist: true` and `forbidNonWhitelisted: true` are both set, stripping unknown fields and rejecting requests that send extra properties.
- **CORS enabled** (`backend/src/main.ts:15`) — `app.enableCors()` is present; no origin restriction is imposed (acceptable for a local MVP).
- **Port 3001 confirmed** (`backend/src/main.ts:17`) — matches the documented spec and the frontend API client.
- **IngestDto uses class-validator** (`backend/src/ingest/ingest.dto.ts`) — `@IsString()`, `@IsNotEmpty()`, and `@IsIn(['text/plain', 'text/markdown', 'application/pdf'])` are all applied correctly.
- **QueryDto uses class-validator** (`backend/src/query/query.dto.ts`) — `@IsString()`, `@IsNotEmpty()`, and `@MinLength(3)` are present.
- **ServiceUnavailableException on proxy failure** (`backend/src/ingest/ingest.service.ts:42`, `backend/src/query/query.service.ts:47`) — both services throw `ServiceUnavailableException` (HTTP 503) when the FastAPI service is unreachable, matching the documented spec.
- **Correct HTTP status codes** — `POST /ingest` returns 201 (`@HttpCode(201)`); `POST /query` returns 200 (`@HttpCode(200)`); validation failures return 400 automatically via `ValidationPipe`.
- **Modular NestJS structure** — each feature (`health`, `ingest`, `query`) has its own module file, controller, service (where applicable), and DTO. `AppModule` only imports the three feature modules with no extraneous logic.
- **HealthModule has no service** — acceptable; the `GET /health` endpoint is pure and stateless; no service layer is warranted.
- **Logger used in both services** — `new Logger(ServiceName.name)` is used in `IngestService` and `QueryService` for error tracing (`ingest.service.ts:16`, `query.service.ts:16`).
- **HttpModule imported per feature** — both `IngestModule` and `QueryModule` import `HttpModule` from `@nestjs/axios`; this is correct for scoped DI.
- **E2E test for health endpoint** (`backend/test/health.e2e-spec.ts`) — asserts HTTP 200, `{ status: 'ok' }` shape, and that `timestamp` is a valid ISO string. Real, meaningful assertions.
- **E2E tests for ingest endpoint** (`backend/test/ingest.e2e-spec.ts`) — covers 201 on valid body, 400 on missing `filename`, 400 on missing `content`, 400 on invalid `mimeType`, and 400 on empty body. `HttpService.post` is properly spied on via `jest.spyOn`. All assertions check real response shapes.
- **E2E tests for query endpoint** (`backend/test/query.e2e-spec.ts`) — covers 200 on valid question (with source shape assertion), 400 on empty string, 400 on string shorter than 3 chars, 400 on missing field, and 400 on extra fields (`forbidNonWhitelisted`).
- **Embeddings service handles both `text/markdown` and `text/plain`** (`embeddings-service/main.py:119-130`) — `MarkdownHeaderTextSplitter` is used for markdown and `RecursiveCharacterTextSplitter` for plain text and PDF.
- **Embeddings service returns JSON errors with HTTP status** (`embeddings-service/main.py:133`) — `HTTPException(status_code=422, detail="...")` is raised when no chunks are created, which FastAPI serialises to `{ "detail": "..." }` with the correct status code.
- **Empty-chunk guard in embeddings service** (`embeddings-service/main.py:132-133`) — the `if not chunks` guard prevents storing zero documents and returns a 422 before touching ChromaDB.
- **Lazy embedding initialisation** (`embeddings-service/main.py:52-61`) — `get_embeddings()` caches the `HuggingFaceEmbeddings` instance in a module-level variable, avoiding redundant model loads on every request.
- **Source filename stored in chunk metadata** (`embeddings-service/main.py:137-138`) — iterates chunks and attaches `source: filename` to each chunk's metadata before persisting.

## Issues Found

- **[SEVERITY: MED]** `backend/src/ingest/ingest.service.ts:42` — The `catch` block swallows ALL errors from the downstream HTTP call and always throws `ServiceUnavailableException`. If the FastAPI service is running but returns a 422 (e.g., empty content → no chunks), the NestJS layer will misreport it as 503 instead of forwarding the 422/400 to the client. **Suggested fix:** Inspect `err.response?.status` inside the catch block; if the status is 4xx, re-throw a `BadRequestException` (or `HttpException`) with the downstream error detail. Only throw `ServiceUnavailableException` for connection errors (`!err.response`).
- **[SEVERITY: MED]** `backend/src/query/query.service.ts:45` — Same blanket catch issue as `IngestService`: any downstream 4xx from FastAPI is masked as 503. **Suggested fix:** Same pattern — differentiate 4xx responses from true connectivity failures.
- **[SEVERITY: LOW]** `backend/src/ingest/ingest.service.ts:17` — The Python service URL (`http://localhost:8000`) is hard-coded. In a containerised or CI environment this will fail. **Suggested fix:** Read from `process.env.EMBEDDINGS_SERVICE_URL` with a fallback: `process.env.EMBEDDINGS_SERVICE_URL ?? 'http://localhost:8000'`.
- **[SEVERITY: LOW]** `backend/src/query/query.service.ts:16` — Same hard-coded URL issue as `IngestService`. **Suggested fix:** Same environment-variable pattern.
- **[SEVERITY: LOW]** `backend/test/jest-e2e.json` — The `rootDir` is set to `.` (the `test/` directory), but the test files import from `../src/app.module`. This works at runtime but means `ts-jest` module resolution is relative to `test/` rather than `backend/`. Consider setting `rootDir: ".."` and updating `testRegex` to `"./test/.+\\.e2e-spec\\.ts$"` for cleaner resolution.
- **[SEVERITY: LOW]** `embeddings-service/requirements.txt` — No version pins are specified (e.g., `fastapi`, `uvicorn[standard]`). This will produce non-reproducible installs. **Suggested fix:** Pin versions with `==` or at minimum `>=x,<y` constraints, or generate a `requirements-lock.txt` via `pip freeze`.
- **[SEVERITY: LOW]** `embeddings-service/main.py:156` — The Ollama LLM model (`"mistral"`) and embedding model (`"all-MiniLM-L6-v2"`) are hard-coded constants. If Ollama is not running or the model is not pulled, the `/query` endpoint will raise an unhandled exception. **Suggested fix:** Wrap `qa_chain.invoke(...)` in a `try/except` block and raise `HTTPException(status_code=503, ...)` to return a clean error to the NestJS layer rather than a 500 stack trace.

## Summary

The NestJS backend is well-structured: every feature is a clean module, DTOs are properly decorated, global `ValidationPipe` is configured correctly, and the e2e test suite covers both happy paths and validation failures with real assertions. The main gap is that both proxy services swallow all downstream errors as 503, which will obscure 4xx validation errors from the Python layer; this is a medium-severity issue that should be fixed before production use but does not block local MVP smoke testing.
