# Proposal

## Why

When the agent runs `npx tsc --noEmit` in a newly scaffolded TypeScript project before installing `typescript` in `devDependencies`, `npx` resolves the unrelated `tsc` npm package and fails with `"This is not the tsc command you are looking for"`.

## What Changes

- Update `STAGE_OBJECTIVES.apply` and `STAGE_OBJECTIVES.test` in `src/lib/agent/prompt-builder.ts` to instruct the agent to install `typescript` (and required `@types/*` packages) in `devDependencies` before running typechecks and to use `npx --no-install tsc --noEmit` (or `npm run build`) so `npx` never fetches the unrelated `tsc` stub package.
- Add unit test assertions in `src/lib/agent/__tests__/prompt-builder.test.ts`.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- (none — prompt-guidance refinement only; `skip_specs: true` set in `.openspec.yaml`)

## Impact

- `src/lib/agent/prompt-builder.ts`
- `src/lib/agent/__tests__/prompt-builder.test.ts`
