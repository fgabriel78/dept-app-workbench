# Tasks

## 1. TypeScript Typecheck Guidance

- [x] 1.1 Update `STAGE_OBJECTIVES.apply` and `STAGE_OBJECTIVES.test` in `src/lib/agent/prompt-builder.ts` to instruct the agent to install `typescript` (and needed `@types/*` packages) in `devDependencies` before typechecking and to run `npx --no-install tsc --noEmit` or `npm run build`; add an assertion in `src/lib/agent/__tests__/prompt-builder.test.ts` and verify with `npx tsc --noEmit` and `npm test`.
