# Tasks

## 1. Six-Stage Lifecycle, i18n, and Agent Stage Wiring

- [x] 1.1 Add `"test"` between `"apply"` and `"archive"` in `STAGES` (`src/lib/types.ts`) along with `PreviewStatus` types, update `inspectWorkspaceState` (`src/lib/workspace/state.ts`) to emit 6 stages and recommend `"test"` when `allTasksDone`, and update `src/lib/workspace/__tests__/state.test.ts` (verify with `npx vitest run src/lib/workspace/__tests__/state.test.ts`).
- [x] 1.2 Add localized `"test"` stage labels/prompts and preview panel strings to `src/lib/i18n/types.ts`, `en.ts`, `es.ts`, and `ca.ts`, and update `src/components/workbench/__tests__/WorkspaceHeader.test.tsx` for 6 stages (verify with `npx vitest run src/lib/i18n/__tests__/i18n.test.ts src/components/workbench/__tests__/WorkspaceHeader.test.tsx`).
- [x] 1.3 Wire `"test"` in `src/lib/tools/stage-tools.ts`, `src/lib/agent/turn-runner.ts` (`maxSteps: 40`), and `src/lib/agent/prompt-builder.ts` (including embedded SQLite local-profile guidance across `propose`, `apply`, and `test`), and update `src/lib/tools/__tests__/stage-tools.test.ts` and `src/lib/agent/__tests__/prompt-builder.test.ts` (verify with `npx vitest run src/lib/tools/__tests__/stage-tools.test.ts src/lib/agent/__tests__/prompt-builder.test.ts`).

## 2. Local Preview Process Manager & API

- [x] 2.1 Implement `src/lib/workspace/preview-manager.ts` (free port allocation, `package.json` `dev`/`start` script detection, embedded SQLite env defaults `DATABASE_URL=file:./dev.db` & `DB_CLIENT=sqlite`, sanitized log buffer, readiness check, and cross-platform process tree termination) and unit tests in `src/lib/workspace/__tests__/preview-manager.test.ts` (verify with `npx vitest run src/lib/workspace/__tests__/preview-manager.test.ts`).
- [x] 2.2 Create `src/app/api/workspace/preview/route.ts` (`GET` status/logs, `POST` start/restart, `DELETE` stop) with workspace root validation.

## 3. Live Preview Panel UI & Integration

- [x] 3.1 Create `src/components/workbench/AppPreviewPanel.tsx` (Start/Restart/Stop buttons, status badge, "Open in new tab" link, embedded `<iframe>` preview, and collapsible server logs) and wire it into `src/components/workbench/WorkbenchApp.tsx` for the `test` stage (also stopping any running preview on workspace switch and adding `test: []` to `turnsByStage`).
- [x] 3.2 Run `npx tsc --noEmit` and `npm test` to verify all typechecks and tests pass.
