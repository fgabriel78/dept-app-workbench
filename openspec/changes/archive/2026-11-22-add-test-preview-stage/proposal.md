# Proposal

## Why

Currently the workbench moves directly from `Apply` to `Archive` without letting business stakeholders run and visually test the newly implemented application before archiving. Furthermore, applications that target external databases (e.g., PostgreSQL or MySQL) cannot be previewed locally unless they support an embedded SQLite runtime profile.

## What Changes

- Expand the workbench lifecycle from 5 stages to 6 stages by inserting a **`Test`** (`Probar` in `es`, `Provar` in `ca`) stage between `Apply` and `Archive` across `STAGES`, `inspectWorkspaceState`, `WorkspaceHeader`, `WorkbenchApp`, `stage-tools`, `prompt-builder`, and `i18n` (`en`, `es`, `ca`).
- Add a managed local preview runtime (`src/lib/workspace/preview-manager.ts` + `/api/workspace/preview` route) that allocates a free local port, launches the workspace application in the background with embedded SQLite environment defaults (`DATABASE_URL=file:./dev.db`, `DB_CLIENT=sqlite`, `PORT=<port>`), streams/buffers recent logs, and cleanly stops the process on demand or when switching workspaces.
- Add a live preview panel component (`src/components/workbench/AppPreviewPanel.tsx`) rendered during the `Test` stage with Start / Stop / Restart controls, clickable `http://localhost:<port>` link, embedded `<iframe>` preview, and collapsible server logs.
- Update `Propose`, `Apply`, and `Test` stage prompts in `src/lib/agent/prompt-builder.ts` so any application requiring a database includes an embedded SQLite local profile + schema initialization/seed, and the `Test` stage agent prepares the SQLite database, fixes runtime/screen issues if found, and verifies the app before the user moves to `Archive`.

## Capabilities

### New Capabilities

- `app-preview-runtime`: Manages launching, monitoring, and stopping the implemented workspace application on a free local port with an embedded SQLite database profile and an interactive live preview panel in the `Test` stage.

### Modified Capabilities

- `workspace-lifecycle`: Expand the lifecycle stepper and stage-readiness detection from 5 stages to 6 stages (`Brief`, `Explore`, `Propose`, `Apply`, `Test`, `Archive`), recommending `Test` once all tasks in `Apply` are completed.

## Impact

- `src/lib/types.ts` (`STAGES`, preview types)
- `src/lib/workspace/state.ts` (6-stage detection, `recommendedStage: "test"` when tasks complete)
- `src/lib/workspace/preview-manager.ts` (new process manager)
- `src/app/api/workspace/preview/route.ts` (new `GET`/`POST`/`DELETE` API route)
- `src/components/workbench/AppPreviewPanel.tsx` (new preview panel UI)
- `src/components/workbench/WorkbenchApp.tsx` (6-stage state + `AppPreviewPanel` in `test` stage)
- `src/lib/tools/stage-tools.ts` (`test` stage tool permissions)
- `src/lib/agent/prompt-builder.ts` (`propose`, `apply`, `test` objectives & SQLite profile guidance)
- `src/lib/agent/turn-runner.ts` (`maxSteps` for `test`)
- `src/lib/i18n/types.ts`, `en.ts`, `es.ts`, `ca.ts`
- Unit tests across `state.test.ts`, `stage-tools.test.ts`, `prompt-builder.test.ts`, `WorkspaceHeader.test.tsx`, `i18n.test.ts`, and new `preview-manager.test.ts`
