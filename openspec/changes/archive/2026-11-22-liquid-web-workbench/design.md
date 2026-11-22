# Design

## Context
See `proposal.md` for motivation. This is a greenfield companion application (`dept-app-workbench`) running locally on a user's workstation (`localhost`). To avoid multi-stack complexity, it uses the same frontend/UI stack as the departmental template (`Next.js App Router + strict TypeScript + Tailwind CSS + shadcn/ui + Lucide`), but intentionally omits PostgreSQL/Prisma and corporate SSO since all state lives in the local project filesystem and browser session.

## Goals / Non-Goals
**Goals:**
- Provide a zero-IDE browser experience for non-technical users across all 5 stages (`Brief`, `Explore`, `Propose`, `Apply`, `Archive`).
- Keep the target project's `.agents/` files unmodified by injecting a thin Web Adapter prompt + structured UI tools at runtime.
- Enforce strict path-jailing and stage-based tool permissions on the local Node.js backend.

**Non-Goals:**
- Multi-user authentication, remote Git hosting, or containerized sandboxing (local single-workstation only).
- Database persistence of chat histories (conversation state is kept in memory/local JSON per workspace session).

## Decisions

### 1. Direct LLM API via TypeScript SDK + SSE Route Handler
- **Decision:** Use a Next.js Route Handler (`POST /api/agent/turn`) streaming Server-Sent Events (SSE) backed by a TypeScript LLM SDK (e.g., Vercel AI SDK `streamText` or official provider SDK configured via `.env`).
- **Rationale:** Gives native structured tool calling (`ask_questions`, `render_diagram`), clean token streaming, and deterministic turn pausing when waiting for user form input—avoiding subprocess/PTY fragility on Windows.
- **Alternative considered:** Wrapping a local CLI agent subprocess (`agy`/`claude`). Rejected for v1 due to brittle stdout parsing and Windows PTY handling.

### 2. Thin Web Adapter Layer for Liquid UI
- **Decision:** At the start of each stage, the backend reads the target project's `.agents/workflows/dept-app-brief.md`, `.agents/rules/app-brief-openspec-bridge.md`, and `.agents/skills/openspec-*` files, and appends a concise **Web UI Adapter** system instruction requiring:
  - Use `ask_questions({ title?, questions: [{ id, prompt, type: "text" | "single_choice" | "multi_choice" | "confirm", options?, placeholder? }] })` whenever asking the user 1 or more questions.
  - Use `mermaid` fenced blocks (or `render_diagram({ title, mermaid })`) for any diagrams instead of ASCII art.
- **Rationale:** Preserves 100% compatibility of `.agents/` for IDE users while giving the web UI deterministic structured payloads.

### 3. Client-Side Mermaid Rendering
- **Decision:** Render `mermaid` blocks on the client using `mermaid` (SVG output) wrapped in a shadcn/ui Card with zoom/reset and a "View source" toggle.
- **Rationale:** Zero server-side headless browser overhead; handles flowcharts, state diagrams, sequence diagrams, and ERDs natively.

### 4. Path-Jailed & Stage-Gated Workspace Tools
- **Decision:** Implement a `WorkspaceToolbox` module in `src/lib/tools/` that resolves every path with `path.resolve(projectRoot, targetPath)` and verifies `resolved.startsWith(projectRoot + path.sep)` (using `fs.realpathSync` on existing paths).
- **Stage matrix:**
  - `brief`: `read_file`, `list_dir`, `write_file` (scoped to `app-brief.md` or user-confirmed files), `ask_questions`, `render_diagram`
  - `explore`: `read_file`, `list_dir`, read-only `openspec` commands, `ask_questions`, `render_diagram`
  - `propose`: `read_file`, `list_dir`, `write_file`, `openspec` CLI (`new change`, `status`, `instructions`), `ask_questions`, `render_diagram`
  - `apply`: `read_file`, `write_file`, `edit_file`, `list_dir`, `run_command` (`npm`, `npx tsc`, `openspec`, etc.), `ask_questions`, `render_diagram`
  - `archive`: `read_file`, `list_dir`, `openspec archive`, `ask_questions`

## Risks / Trade-offs
- **LLM tool-call compliance during `apply`:** Writing full Next.js apps requires reliable `edit_file` and error-recovery loops → Mitigation: keep `edit_file` simple (exact match replacement with clear line-number errors) and surface command output in an expandable drawer so users/devs can inspect failures.
- **Malicious or destructive shell commands in `apply`:** `run_command` executes locally → Mitigation: restrict `cwd` to `projectRoot` and optionally require a one-click user confirmation card for destructive commands.
