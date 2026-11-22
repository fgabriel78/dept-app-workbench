# Proposal

## Why

Multi-step stages like `propose` (creating `proposal.md`, multiple `specs/*.md`, `design.md`, and `tasks.md`) and `apply` routinely exceed the hardcoded `maxSteps: 8` limit in `streamText`, causing the turn to silently end mid-work without finishing artifacts or emitting a closing message. Additionally, `openspec context` is blocked in `explore`/`propose` despite being read-only, and non-technical users lack a clear closing explanation and visual next-stage call-to-action when a stage finishes.

## What Changes

- Raise `maxSteps` for multi-step stages (`propose` and `apply`) in `src/lib/agent/turn-runner.ts` and emit a localized, non-technical notice if a turn ever stops due to step-limit exhaustion without a closing message.
- Permit read-only `openspec context` in `getStageCommandFilter` for `explore` and `propose` in `src/lib/tools/stage-tools.ts` so OpenSpec skills do not trigger an initial blocked-command error.
- Update stage objectives / `WEB_ADAPTER_CONTRACT` in `src/lib/agent/prompt-builder.ts` to instruct the assistant to conclude completed stages (especially `propose` and `apply`) with a plain-language summary and next-step guidance.
- Add a localized next-stage handoff banner/button in `src/components/workbench/WorkbenchApp.tsx` (with translations in `src/lib/i18n/{en,es,ca,types}.ts`) when streaming is idle and `workspaceState.recommendedStage !== activeStage`.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `liquid-agent-ui`: Ensure multi-step turns complete or report step-limit pauses clearly, and display a localized next-stage handoff call-to-action when the workspace advances to a new recommended stage.

## Impact

- `src/lib/agent/turn-runner.ts` (`maxSteps`, step-limit fallback notice)
- `src/lib/tools/stage-tools.ts` (`getStageCommandFilter` for `explore` and `propose`)
- `src/lib/agent/prompt-builder.ts` (`STAGE_OBJECTIVES` / `WEB_ADAPTER_CONTRACT`)
- `src/components/workbench/WorkbenchApp.tsx` (next-stage handoff banner)
- `src/lib/i18n/types.ts`, `en.ts`, `es.ts`, `ca.ts`
- `src/lib/agent/__tests__/turn-runner.test.ts`, `src/lib/tools/__tests__/stage-tools.test.ts`
