# Design

## Context

See `proposal.md` for motivation. When `typescript` is not installed in a workspace's `node_modules`, running `npx tsc --noEmit` resolves the unrelated `tsc` stub package from npm.

## Goals / Non-Goals

**Goals:**
- Instruct `Apply` and `Test` stages in `src/lib/agent/prompt-builder.ts` to install `typescript` (and required `@types/*`) in `devDependencies` before typechecking, and to use `npx --no-install tsc --noEmit` (or `npm run build`).

**Non-Goals:**
- Intercepting or rewriting `run_command` shell strings at runtime.

## Decisions

1. **Prompt guidance in `STAGE_OBJECTIVES.apply` and `STAGE_OBJECTIVES.test`:**
   - **Chosen approach**: Explicitly tell the agent to install `typescript` in `devDependencies` before running typechecks and use `npx --no-install tsc --noEmit` or `npm run build`.
   - **Why**: Simple, transparent, and prevents `npx` from downloading the dummy `tsc` package.

## Risks / Trade-offs

- [None significant] → Purely additive prompt guidance.
