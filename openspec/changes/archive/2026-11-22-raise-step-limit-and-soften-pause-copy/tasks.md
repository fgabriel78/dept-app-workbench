# Tasks

## 1. Higher Step Budget & Jargon-Free Pause Copy

- [x] 1.1 Raise default `maxSteps` in `src/lib/agent/turn-runner.ts` (`100` for `apply`, `40` for `propose`, `20` for other stages).
- [x] 1.2 Update `stepLimitReached` copy in `src/lib/i18n/en.ts`, `es.ts`, and `ca.ts` to remove technical jargon ("steps", "pasos", "turno"), update `src/lib/agent/__tests__/turn-runner.test.ts`, and verify with `npx tsc --noEmit` and `npm test`.
