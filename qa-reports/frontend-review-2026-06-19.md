# Frontend QA Review — 2026-06-19

## Passed

- **axios timeout set** (`frontend/lib/api.ts:3`) — `timeout: 30000` (30 s) is configured on the shared axios instance. This prevents requests from hanging indefinitely.
- **`axios.isAxiosError` used correctly** (`frontend/components/ChatWindow.tsx:59`, `frontend/components/IngestForm.tsx:72`) — both components call `axios.isAxiosError(err)` to distinguish Axios errors from generic JS errors before inspecting `err.response`.
- **400 errors handled and displayed** (`ChatWindow.tsx:63-69`, `IngestForm.tsx:76-82`) — both components inspect `err.response?.status === 400`, parse the NestJS class-validator array message, and display a human-readable string.
- **503 errors handled and displayed** (`ChatWindow.tsx:70-74`, `IngestForm.tsx:83-87`) — 503 is caught and shown as a service-unavailable message.
- **Network errors handled** (`ChatWindow.tsx:75-77`, `IngestForm.tsx:88-90`) — the `!err.response` branch displays a "cannot reach server" message, covering cases where the backend is not running at all.
- **FileReader errors handled** (`IngestForm.tsx:40-41`) — `reader.onerror` is implemented and rejects the promise with a descriptive `Error`, which is then caught by the outer `catch` block and shown to the user.
- **Loading state disables input and button** (`ChatWindow.tsx:151`, `ChatWindow.tsx:163`) — both the text input and Send button carry `disabled={isLoading}`, preventing double-submission.
- **Loading spinner shown while request is in-flight** (`ChatWindow.tsx:125-131`) — `{isLoading && <LoadingSpinner />}` is rendered inline in the message list.
- **IngestForm disables submit while uploading** (`IngestForm.tsx:144`) — the Upload button has `disabled={isUploading}`.
- **IngestForm button text changes during upload** (`IngestForm.tsx:153`) — button renders `'Uploading...'` while `isUploading` is true, giving clear feedback.
- **`<label>` on file input** (`IngestForm.tsx:104-108`, `IngestForm.tsx:110`) — a `<label htmlFor="file-upload">` is linked to `<input id="file-upload">`, satisfying the label-input association requirement.
- **`aria-label` on question input** (`ChatWindow.tsx:149`) — `aria-label="Question input"` is present.
- **`aria-label` on submit button** (`ChatWindow.tsx:165`) — `aria-label="Send question"` is present.
- **`LoadingSpinner` has `role="status"` and `aria-label`** (`LoadingSpinner.tsx:6-7`) — both `role="status"` and `aria-label="Loading"` are set; a `<span className="sr-only">Loading...</span>` is also included for screen readers.
- **Success result uses `role="status"` and `aria-live="polite"`** (`IngestForm.tsx:158-159`) — the success banner announces itself to assistive technology.
- **Error banner uses `role="alert"` and `aria-live="assertive"`** (`IngestForm.tsx:171-172`) — the error div is properly wired for immediate AT announcement.
- **Zustand store is lean and correct** (`store/chatStore.ts`) — `messages`, `isLoading`, and three mutators are typed and exported; no leaking of side effects inside the store.
- **Auto-scroll to bottom after new messages** (`ChatWindow.tsx:31-33`) — `useEffect` with `[messages, isLoading]` dependency scrolls `bottomRef` into view.
- **SourcesPanel uses `<details>/<summary>` for collapsibility** (`SourcesPanel.tsx:13-15`) — native HTML collapsible, no JS required; keyboard-accessible out of the box.
- **Markdown content truncated at 150 chars** (`SourcesPanel.tsx:24-27`) — prevents oversized source snippets from overwhelming the UI.
- **Ingest page has a back-to-chat link** (`app/ingest/page.tsx:9-14`) — `<Link href="/">← Back to chat</Link>` is present.
- **`ChatWindow.test.tsx` — real assertions** (`__tests__/ChatWindow.test.tsx`) — tests cover: input/button rendering, loading spinner while request is in-flight, successful answer with sources label, and 503 error message display. No `expect(true)` or trivial stubs.
- **`IngestForm.test.tsx` — real assertions** (`__tests__/IngestForm.test.tsx`) — tests cover: label/input rendering with `htmlFor` linkage, success message with chunk count, and 503 error path. Custom `MockFileReader` correctly simulates async `readAsText`.
- **`jest.mock('@/lib/api', ...)` is correct** in both test files — the mock is hoisted before imports, and the mocked function is cast to `jest.MockedFunction<typeof ...>` for type safety.
- **Form-level validation in ChatWindow** (`ChatWindow.tsx:143-146`) — `react-hook-form` enforces `required` and `minLength: 3` client-side, mirroring backend `QueryDto` validation.
- **File type validation in IngestForm** (`IngestForm.tsx:117-125`) — `validate` callback checks the file extension against `['txt', 'md']`, matching the backend `@IsIn` constraint.
- **`lang="en"` on root `<html>`** (`app/layout.tsx:13`) — correct for accessibility.
- **`next.config.js` is minimal and does not introduce security issues** — no unnecessary `rewrites`, `headers`, or `experimental` flags.

## Issues Found

- **[SEVERITY: MED]** `frontend/__tests__/ChatWindow.test.tsx:108` — The test uses `const axios = require('axios')` and `jest.spyOn(axios, 'isAxiosError').mockReturnValue(true)` to mock the type-guard. Because `axios.isAxiosError` is imported as a named export in `ChatWindow.tsx` (via `import axios from 'axios'`), this spy operates on the same module object at runtime in Jest's CommonJS environment and should work — but it is fragile: if the module is ever converted to ESM or tree-shaken, the spy will silently stop working. The same pattern appears in `IngestForm.test.tsx:106`. **Suggested fix:** Instead of spying on `axios.isAxiosError`, throw a real Axios error using `axios.create().get('/').catch(...)` or construct one with `Object.assign(new Error(), { isAxiosError: true, response: { status: 503, data: ... } })` and let the real `axios.isAxiosError` evaluate it.
- **[SEVERITY: MED]** `frontend/lib/api.ts:3` — The backend base URL (`http://localhost:3001`) is hard-coded. In any environment other than a local developer machine (staging, CI, Docker Compose) this will fail with a CORS or network error. **Suggested fix:** Read from an environment variable: `baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'`.
- **[SEVERITY: LOW]** `frontend/components/IngestForm.tsx:120` — The `allowed` variable on line 120 is declared but never used (`const allowed = ['text/plain', 'text/markdown', '']`). The actual check on lines 122-124 uses the file extension (`ext`). **Suggested fix:** Remove the unused `allowed` array.
- **[SEVERITY: LOW]** `frontend/components/SourcesPanel.tsx:21` — Sources are rendered with `key={index}`. If the sources array can change order or items can be removed, React will incorrectly reuse DOM nodes. **Suggested fix:** Use a stable key such as `key={source.metadata.source ?? index}` if a stable identifier is available in the metadata.
- **[SEVERITY: LOW]** `frontend/components/ChatWindow.tsx:97-102` — The Clear button does not have a confirmation step. Clicking it accidentally will permanently clear the entire conversation history from the Zustand store (which is non-persistent). **Suggested fix:** Either add a `window.confirm` guard or display an undo toast for 3-5 seconds before clearing. For MVP this is low priority.
- **[SEVERITY: LOW]** `frontend/components/IngestForm.tsx:46-48` — `getMimeType` returns `file.type` directly if it is truthy. Browsers often report `.md` files as `text/plain` rather than `text/markdown`, which means the NestJS DTO's `@IsIn` check for `text/markdown` will still pass (since `text/plain` is also allowed), but the Python splitter will use `RecursiveCharacterTextSplitter` instead of `MarkdownHeaderTextSplitter`. The `.md` extension fallback on line 47 only fires when `file.type` is empty. **Suggested fix:** Check the extension first (`if (file.name.endsWith('.md')) return 'text/markdown'`) and fall through to `file.type` only as a secondary signal.
- **[SEVERITY: LOW]** `frontend/jest.config.js:4` — Jest is configured to use `babel-jest` with Babel presets rather than `ts-jest`. This means TypeScript type errors are silently ignored during test runs. Combined with the `@ts-expect-error` suppression in `IngestForm.test.tsx:40`, type issues in tests will not be caught by `jest`. **Suggested fix:** Either switch to `ts-jest` (consistent with the backend) or add a separate `tsc --noEmit` step to CI for the frontend tests.
- **[SEVERITY: LOW]** `frontend/components/MessageBubble.tsx` — The message bubble renders raw string content with no sanitisation. If the RAG answer ever contains HTML entities or script tags, React will escape them safely (string children are escaped by default), so there is no XSS risk. However, markdown formatting (e.g., `**bold**`, `- list`) is rendered as literal text rather than formatted output. **Suggested fix (post-MVP):** Consider a markdown renderer such as `react-markdown` for the assistant bubble.

## Summary

The frontend is well-implemented for an MVP: loading and error states are correctly handled in both components, all accessibility requirements (labels, aria-labels, `role="status"`) are satisfied, the Zustand store is clean, and the RTL test suite has real, specific assertions covering happy paths and error paths. The main actionable items are the hard-coded API URL (which blocks non-local deployments) and the fragile `axios.isAxiosError` spy pattern in the tests; both are medium-severity and straightforward to fix.

---

## E2E Smoke Test Checklist (Manual)

- [ ] `cd embeddings-service && uvicorn main:app --host 0.0.0.0 --port 8000`
- [ ] `cd backend && npm run start:dev` (port 3001)
- [ ] `cd frontend && npm install && npm run dev` (port 3000)
- [ ] `curl http://localhost:3001/health` → `{ "status": "ok" }`
- [ ] POST /query with `{ "question": "What is the avg engineer salary?" }` → returns answer + sources
- [ ] Open http://localhost:3000 → type question → answer + collapsible sources appear
- [ ] Go to /ingest → upload a .md file → success message with chunk count
