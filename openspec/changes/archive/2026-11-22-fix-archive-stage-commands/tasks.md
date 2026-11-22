# Tasks

## 1. Archive Stage Command Filter & Prompt Guidance

- [x] 1.1 Allow `instructions` and `context` in `getStageCommandFilter("archive")` in `src/lib/tools/stage-tools.ts`, and add test assertions in `src/lib/tools/__tests__/stage-tools.test.ts` (verify with `npx vitest run src/lib/tools/__tests__/stage-tools.test.ts`).
- [x] 1.2 Update `STAGE_OBJECTIVES.archive` in `src/lib/agent/prompt-builder.ts` to instruct the agent to archive using `openspec archive "<change-name>" --yes` instead of `mkdir`, `mv`, or manual file edits; add an assertion in `src/lib/agent/__tests__/prompt-builder.test.ts` and verify with `npx tsc --noEmit` and `npm test`.
