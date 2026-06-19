I want to build an MVP for a RAG-based "Startup Hiring & Salary Intelligence" 
tool using Next.js (frontend) and NestJS (backend). I want you to operate as 
a coordinated team of 3 sub-agents with clearly separated responsibilities. 
Use Claude Code's sub-agent / task delegation capability to spin these up as 
distinct agents, each with their own scope, context, and file ownership.

---

AGENT 1: BACKEND AGENT
Owns: /backend directory (NestJS)

Responsibilities:
- Set up NestJS project structure (modules, controllers, services)
- Build REST API endpoints:
  - POST /query → accepts a question, runs RAG pipeline (retrieval + LLM call), returns answer + source chunks
  - POST /ingest → accepts a document (md/txt/pdf), chunks it, embeds it, stores in ChromaDB
  - GET /health → health check endpoint
- Integrate with ChromaDB (via Python microservice OR a Node-compatible Chroma client)
- Integrate with Ollama (local LLM) for generation
- Use sentence-transformers (all-MiniLM-L6-v2) for embeddings — call via a small Python 
  helper service if needed, since NestJS is Node-based
- Add proper error handling, request validation (DTOs with class-validator), and logging
- Write a clear README documenting each endpoint with request/response examples
- Once backend endpoints are built and tested locally (use curl or Postman examples 
  in README), explicitly signal "BACKEND READY" and pass the following to the 
  Frontend Agent:
  - Base API URL
  - All endpoint contracts (request/response shapes)
  - Any auth requirements (if added)
  - Known limitations or edge cases

---

AGENT 2: FRONTEND AGENT
Owns: /frontend directory (Next.js)

Responsibilities:
- WAIT until Backend Agent signals "BACKEND READY" with endpoint contracts before 
  building API integration code (you may scaffold UI components in parallel 
  using mock data, but do not finalize API calls until contracts are confirmed)
- Build a clean chat-style UI:
  - Input box for questions
  - Display area for AI answers
  - Collapsible "Sources" section showing retrieved chunks (from source_documents)
  - Loading states, error states
- Use Tailwind CSS for styling
- Use React Hook Form for the input, Zustand for any global state if needed
- Connect to backend API once contracts are received
- Add a simple "Ingest Document" page/section to upload new data files to 
  the /ingest endpoint
- Write a README with setup instructions and screenshots/description of UI flow

---

AGENT 3: QA AGENT
Owns: Read access to both /backend and /frontend, writes only to /qa-reports

Responsibilities:
- Run continuously in the background, checking in after each agent completes 
  a meaningful milestone (not just at the very end)
- For Backend Agent's code, check:
  - Are inputs validated? (no unhandled malformed requests)
  - Are errors caught and returned with proper HTTP status codes?
  - Is there at least one test per endpoint (use Jest, NestJS's default testing setup)?
  - Does it follow NestJS module/service/controller separation cleanly?
- For Frontend Agent's code, check:
  - Are loading and error states handled in the UI?
  - Is there at least one component test (React Testing Library)?
  - Is the API integration resilient to backend errors (timeouts, 500s)?
  - Basic accessibility check (labels on inputs, alt text, etc.)
- After each review, write a short feedback report to /qa-reports/ named 
  backend-review-{date}.md or frontend-review-{date}.md, listing:
  - What passed
  - What needs fixing (with specific file/line references)
  - Suggested fix or pattern to use
- Send feedback directly back to the relevant agent and ask them to address 
  it before marking their part as "done"
- Do a final end-to-end smoke test once both agents report completion: 
  spin up both servers, send a real query through the full pipeline, and 
  confirm the answer + sources render correctly in the UI

---

COORDINATION RULES:
1. Backend Agent works first and independently until "BACKEND READY"
2. Frontend Agent can scaffold UI in parallel but holds final API wiring 
   until backend contracts are received
3. QA Agent reviews incrementally — not just at the end — and can send 
   either agent back to fix issues before proceeding
4. All agents log their status changes (e.g., "BACKEND READY", "FRONTEND UI SCAFFOLDED", 
   "QA REVIEW COMPLETE — backend") to a shared /agent-status.md file so progress 
   is visible across the whole team
5. No agent merges/finalizes their part until QA has reviewed and approved it

Start by having the Backend Agent scaffold the NestJS project and begin building 
the /ingest and /query endpoints. Show me the agent breakdown and first steps 
before generating code.