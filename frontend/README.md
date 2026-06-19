# Startup Hiring & Salary Intelligence — Frontend

Next.js 14 (App Router) chat interface for the RAG-powered salary intelligence pipeline.

---

## Prerequisites

- **Node.js 18+**
- **Backend running on port 3001** — start the NestJS backend before using the UI
- **Embeddings service on port 8000** (ChromaDB + FastAPI, managed by the backend)

---

## Setup

```bash
# Install dependencies
npm install

# Start the dev server (runs on http://localhost:3000)
npm run dev
```

For a production build:

```bash
npm run build
npm start
```

---

## Pages

| Route     | Description                                                 |
|-----------|-------------------------------------------------------------|
| `/`       | **Chat** — ask questions about startup salaries and hiring  |
| `/ingest` | **Upload** — add new salary documents (.txt / .md) to the knowledge base |

---

## Testing

```bash
npm test
```

Tests use **Jest** + **React Testing Library** and live in `__tests__/`.

| Test file              | What it covers                                                      |
|------------------------|---------------------------------------------------------------------|
| `ChatWindow.test.tsx`  | Input rendering, loading spinner, successful answer, 503 error path |
| `IngestForm.test.tsx`  | File input label, success message, error message                    |

---

## UI Flow

### Chat (`/`)

1. Type a question in the input (min 3 characters) and press **Send**.
2. Your question appears as a right-aligned blue bubble.
3. While the backend processes the request a loading spinner is shown.
4. The AI answer appears as a left-aligned gray bubble.
5. If the answer used source documents, a collapsible **"N sources used"** section appears below the answer — click to expand individual chunk previews with metadata tags.
6. On error (400 / 503 / network down) a red-bordered error bubble is shown with an explanation.
7. Use the **Clear** button in the toolbar to reset the conversation.

### Document Upload (`/ingest`)

1. Click **Upload Document** and choose a `.txt` or `.md` file.
2. Press **Upload** — the file is read in-browser and the raw text is sent to `POST /ingest`.
3. On success a green banner shows how many chunks were stored.
4. On failure a red banner shows the server error message.
5. Use the **Back to chat** link to return to `/`.

---

## Architecture

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout + global CSS
│   ├── globals.css         # Tailwind directives
│   ├── page.tsx            # Chat page (/)
│   └── ingest/
│       └── page.tsx        # Ingest page (/ingest)
├── components/
│   ├── ChatWindow.tsx      # Main chat UI (react-hook-form + Zustand)
│   ├── IngestForm.tsx      # File upload form
│   ├── MessageBubble.tsx   # Individual chat bubble
│   ├── LoadingSpinner.tsx  # Animated spinner
│   └── SourcesPanel.tsx    # Collapsible sources (details/summary)
├── lib/
│   └── api.ts              # Typed axios client for /query and /ingest
├── store/
│   └── chatStore.ts        # Zustand chat state (messages, isLoading)
└── __tests__/
    ├── ChatWindow.test.tsx
    └── IngestForm.test.tsx
```

**Backend API base URL:** `http://localhost:3001` (configured in `lib/api.ts`)
