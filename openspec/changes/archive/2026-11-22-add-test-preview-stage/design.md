# Design

## Context

See `proposal.md` for motivation. Currently `STAGES` has 5 stages (`brief`, `explore`, `propose`, `apply`, `archive`), `inspectWorkspaceState` jumps from `apply` directly to `recommendedStage = "archive"` when `allTasksDone` is true, and `WorkspaceToolbox.runCommand` only supports short-lived commands (with timeout), not background dev servers.

## Goals / Non-Goals

**Goals:**
- Introduce `test` (`Test` / `Probar` / `Provar`) between `apply` and `archive` across types, state detection, header stepper, i18n, tool permissions, and prompts.
- Manage a single background preview process per workspace in Node.js (`src/lib/workspace/preview-manager.ts`) exposed via `/api/workspace/preview` (`GET`, `POST`, `DELETE`).
- Inject embedded SQLite environment variables (`DATABASE_URL=file:./dev.db`, `DB_CLIENT=sqlite`, `PORT=<freePort>`) when launching the preview server, and guide `Propose`/`Apply`/`Test` prompts to support an embedded SQLite local profile.
- Render `AppPreviewPanel` in `WorkbenchApp` when `activeStage === "test"` (and allow the `Test` agent to prepare/seed the SQLite DB, fix runtime errors, and verify the running app).

**Non-Goals:**
- Running multiple simultaneous preview servers for different workspaces (starting a new preview stops any previously running preview cleanly to avoid orphaned Node processes).
- Provisioning Docker containers or external PostgreSQL/MySQL servers.

## Decisions

1. **Process management (`src/lib/workspace/preview-manager.ts`):**
   - **Chosen approach**: Store the active preview session on `globalThis` (so Next.js dev HMR does not leak orphaned child processes) with:
     - Dynamic free port discovery via `net.createServer().listen(0, "127.0.0.1")`.
     - Script detection from `package.json`: prefer `scripts.dev`, fallback to `scripts.start`. For Next.js (`next dev`) pass `--port <port>` or `PORT=<port>`; for Vite (`vite`) pass `--port <port> --host 127.0.0.1` alongside `PORT=<port>`.
     - Environment defaults: `{ ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1", DB_CLIENT: process.env.DB_CLIENT ?? "sqlite", DATABASE_URL: "file:./dev.db" }` (preserving any workspace `.env` SQLite overrides if the app loads `.env`, while ensuring `DATABASE_URL` defaults to local SQLite).
     - Ring buffer of the last 200 sanitized (`stripAnsi`) log lines.
     - Readiness polling (`fetch("http://127.0.0.1:<port>")` with timeout) before marking status `"running"`, and Windows-safe process tree termination (`taskkill /pid <pid> /T /F` on `win32`, `kill("SIGTERM")` on POSIX).

2. **`Test` stage agent permissions (`stage-tools.ts` & `turn-runner.ts`):**
   - **Chosen approach**: Give `test` the same workspace tools as `apply` (`read_file`, `list_dir`, `write_file`, `edit_file`, `run_command`, `ask_questions`, `render_diagram`) with `maxSteps: 40`, so if the user reports a broken screen or DB initialization issue during `Probar`, the agent can initialize/seed SQLite or fix bugs on the spot.

3. **Workspace state detection (`state.ts`):**
   - **Chosen approach**: When `allTasksDone` is true (`total > 0 && remaining === 0`), set `recommendedStage = "test"` (keeping `phase = "ready-to-archive"` or `"ready-to-test"`? Keep `WorkspacePhase` backward-compatible by adding `"ready-to-test"` or keeping `"ready-to-archive"` — let's keep existing `phase = "ready-to-archive"` so existing tests/contracts don't break unnecessarily, while `recommendedStage = "test"` and both `test` (`active`) and `archive` (`available`) are clickable!).

4. **UI integration (`AppPreviewPanel.tsx` + `WorkbenchApp.tsx`):**
   - **Chosen approach**: Render `AppPreviewPanel` at the top of the `Test` stage main pane (collapsible or toggleable iframe height) with Start / Restart / Stop buttons, status badge, "Open in new tab" link, and expandable server logs. Automatically stop any running preview when switching to a different workspace.

## Risks / Trade-offs

- [Orphaned child processes on Windows when stopping `npm run dev`] → Use `taskkill /pid <pid> /T /F` on `win32` (and `process.kill(-pid)` / `child.kill()` on POSIX) so `npm` + `next`/`vite` grandchildren are terminated cleanly.
- [Some apps set `X-Frame-Options: DENY` blocking `<iframe>`] → Always provide a prominent "Open in new tab" (`target="_blank"`) button right next to the iframe preview.
