# Proposal

## Why

During the `Archive` stage, `.agents/skills/openspec-archive-change/SKILL.md` instructs the agent to run `openspec instructions archive`, `openspec instructions specs`, `mkdir`, and `mv`, which are blocked by `getStageCommandFilter("archive")` (`stage-tools.ts`). Meanwhile, `openspec archive "<name>" --yes` already handles spec syncing and archiving in a single allowed CLI command.

## What Changes

- Allow read-only `openspec instructions` and `openspec context` in `getStageCommandFilter("archive")` (`src/lib/tools/stage-tools.ts`) so skill inspection commands do not fail.
- Update `STAGE_OBJECTIVES.archive` in `src/lib/agent/prompt-builder.ts` to instruct the agent to archive changes using `openspec archive "<change-name>" --yes` (after confirming with the user via `ask_questions` if appropriate) instead of `mkdir`, `mv`, or manual file edits.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `scoped-workspace-tools`: Permit read-only `openspec instructions` and `openspec context` during the `Archive` stage alongside `openspec archive`.

## Impact

- `src/lib/tools/stage-tools.ts`
- `src/lib/agent/prompt-builder.ts`
- `src/lib/tools/__tests__/stage-tools.test.ts`
- `src/lib/agent/__tests__/prompt-builder.test.ts`
