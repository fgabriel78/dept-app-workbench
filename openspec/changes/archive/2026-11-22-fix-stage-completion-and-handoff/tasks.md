# Tasks

## 1. Stage Command Permissions & Step Budget

- [x] 1.1 Allow `openspec context` in `getStageCommandFilter` for `explore` and `propose` in `src/lib/tools/stage-tools.ts`, and add a test case in `src/lib/tools/__tests__/stage-tools.test.ts` (verify with `npx vitest run src/lib/tools/__tests__/stage-tools.test.ts`).
- [x] 1.2 Raise `maxSteps` in `src/lib/agent/turn-runner.ts` (`25` for `propose` and `apply`, `12` for other stages) and emit a localized `stepLimitReached` notice if a turn ends on `finishReason === "tool-calls"` without a closing message; add a test in `src/lib/agent/__tests__/turn-runner.test.ts` (verify with `npx vitest run src/lib/agent/__tests__/turn-runner.test.ts`).

## 2. Stage Handoff Guidance & UI Call-to-Action

- [x] 2.1 Update `STAGE_OBJECTIVES` / `WEB_ADAPTER_CONTRACT` in `src/lib/agent/prompt-builder.ts` so the assistant concludes completed stages with a plain-language summary and clear next-stage guidance, and verify `src/lib/agent/__tests__/prompt-builder.test.ts` passes.
- [x] 2.2 Add localized `stepLimitReached`, `stageHandoffTitle`, and `stageHandoffAction` strings to `src/lib/i18n/types.ts`, `en.ts`, `es.ts`, and `ca.ts`, and render the next-stage handoff banner in `src/components/workbench/WorkbenchApp.tsx` when `!isStreaming && workspaceState && workspaceState.recommendedStage !== activeStage && currentTurns.length > 0`; verify with `npx tsc --noEmit` and `npm test`.
