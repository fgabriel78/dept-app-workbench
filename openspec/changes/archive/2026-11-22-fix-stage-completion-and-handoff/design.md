# Design

## Context

See `proposal.md` for motivation. Currently:
1. `turn-runner.ts` hardcodes `maxSteps: 8`, which is insufficient for `propose` (creating `proposal.md`, multiple `specs/*.md`, `design.md`, and `tasks.md` plus `openspec` CLI checks) and `apply`.
2. `getStageCommandFilter` in `stage-tools.ts` blocks `openspec context` in `explore` and `propose`.
3. `WorkbenchApp.tsx` refreshes `workspaceState` on `artifact_updated`, updating `workspaceState.recommendedStage`, but surfaces no direct handoff prompt/button in the conversation pane.

## Goals / Non-Goals

**Goals:**
- Support multi-step `propose` and `apply` turns cleanly (`maxSteps: 25` for `propose`/`apply`, `12` for other stages) and emit a localized fallback `text_delta` if `finishReason === "tool-calls"` on the final step with no trailing prose.
- Allow read-only `openspec context` in `explore` and `propose`.
- Instruct the agent in `prompt-builder.ts` to close completed stages with a non-technical summary and next-stage guidance.
- Render a localized handoff banner below the conversation turns (above the composer) when `!isStreaming && workspaceState && workspaceState.recommendedStage !== activeStage && currentTurns.length > 0`.

**Non-Goals:**
- Automatically switching `activeStage` without user click (auto-switching mid-conversation would hide the just-finished stage's summary and artifacts).

## Decisions

1. **Stage-aware `maxSteps` and step-limit fallback (`turn-runner.ts`):**
   - **Chosen approach**: Use `25` steps for `propose` and `apply` (and `12` for `brief`/`explore`/`archive`). Track `lastFinishReason` and whether `text-delta` was emitted after the last `tool-call`; if `lastFinishReason === "tool-calls"` when the loop ends without `ask_questions`, emit a localized `\n\n` + `dict.workbench.stepLimitReached` `text_delta` so the user is never left with silent tool rows.

2. **Read-only `openspec context` (`stage-tools.ts`):**
   - **Chosen approach**: Add `context` to the allowed `openspec` subcommands regex for `explore` and `propose`.

3. **Localized stage handoff banner (`WorkbenchApp.tsx` + `i18n`):**
   - **Chosen approach**: Add `stageHandoffTitle(nextStageLabel)` and `stageHandoffAction(nextStageLabel)` to `TranslationDictionary["workbench"]` (`en`, `es`, `ca`) and render a compact banner with an ArrowRight button calling `setActiveStage(workspaceState.recommendedStage)`.

## Risks / Trade-offs

- [Higher `maxSteps` increases worst-case token usage per turn] → Scoped to `25` for `propose`/`apply` and `12` elsewhere, which is bounded and still stops immediately when the model finishes or calls `ask_questions`.
