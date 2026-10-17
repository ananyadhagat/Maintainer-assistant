# Implementation Plan: Live GitHub Fetching & Real-Time SSE Progress Streaming

## Summary
Transform Maintainer Copilot into a fully dynamic, real-time backend-driven system. Eliminate silent demo data fallbacks so every repository analysis fetches live data directly from the GitHub REST API. Implement a Server-Sent Events (SSE) streaming pipeline that broadcasts live, step-by-step progress updates and log messages to the frontend with an animated progress modal and step tracker.

---

## 1. Backend Architecture & Live GitHub Integration

### A. Remove Automatic Demo Fallback
- Update `server/github.ts`:
  - Enforce live GitHub REST API requests for any repository URL entered by the user.
  - Remove automatic silent fallback to demo fixtures on rate limit or error; instead, report precise GitHub API status (e.g., remaining rate limit quota, 404 not found, or private repo notice) and prompt the user to either supply a GitHub token or explicitly switch to Demo Mode.
  - Add search and retrieval support for open & closed issues, pagination up to 50 items, filtering out PRs, and retrieving live pull requests and diffs.

### B. Server-Sent Events (SSE) Stream Endpoint (`GET /api/repository/stream-analyze`)
- Create an SSE endpoint that keeps an open connection (`text/event-stream`) and streams structured events:
  - `event: stage` – current active stage, description, and status (`pending` | `in_progress` | `completed` | `failed`).
  - `event: log` – real-time diagnostic log lines (e.g., `"Fetched 34 open issues from GitHub"`, `"Analyzing PR diffs with Gemini 3.8 Flash..."`).
  - `event: progress` – percentage complete (0% to 100%).
  - `event: complete` – final `RepositoryAnalysisSummary` data payload.
  - `event: error` – error message and recommended resolution.

### C. Live Stages Breakdown
1. **Stage 1: Repository Validation** – Resolves GitHub owner/repo slug, checks accessibility, and retrieves live metadata (stars, forks, open issues count, license).
2. **Stage 2: Issue Ingestion & Segregation** – Streams live issues from GitHub REST API, filtering out pull requests.
3. **Stage 3: Pull Request Pipeline** – Ingests active and recently closed pull requests, branch info, and changed file metrics.
4. **Stage 4: Semantic Duplicate Detection** – Feeds retrieved live issues into Gemini (`gemini-3.8-flash`) to identify duplicate clusters, canonical issues, and symptom overlaps.
5. **Stage 5: Completeness Screening** – Evaluates live issues against the 6-point completeness criteria.
6. **Stage 6: Finalization** – Commits session data to the in-memory cache and history store and emits completion.

---

## 2. Frontend Real-Time Dynamic UI

### A. Live Progress Modal & Step Tracker
- Build an animated, GitHub-inspired progress dashboard that opens during analysis:
  - Step-by-step stage checklist with pulsing status indicators and checkmarks.
  - Animated progress bar showing real-time 0–100% completion.
  - Terminal-style live log viewer displaying actual events streamed from the server.
  - Elapsed timer counter.
  - Graceful cancel button to abort the SSE stream.

### B. Pure Live Data Binding
- Ensure the header, overview, duplicate detector, incomplete issues, and PR analyzer immediately reflect the freshly streamed live repository data.
- Add an explicit "Demo Mode" toggle banner in Settings so users can still test without a GitHub token if they hit anonymous IP limits, but never without explicit consent.

---

## 3. Verification & Testing
1. Test with arbitrary public repositories (e.g. `expressjs/express`, `pallets/flask`, `vuejs/core`).
2. Verify SSE stream events and stage animations in real time.
3. Test Bug Detective against live-retrieved issues.
4. Verify `compile_applet` and `lint_applet` with zero TypeScript errors.
