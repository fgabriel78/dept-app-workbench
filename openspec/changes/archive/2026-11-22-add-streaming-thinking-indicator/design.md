# Design

## Context

See `proposal.md` for motivation. In `src/components/workbench/WorkbenchApp.tsx`, `runTurn` appends an empty `assistantTurn` immediately and sets `isStreaming = true`. Until the first `text_delta`, `tool_activity`, `diagram`, `question_group`, or `error` arrives, nothing renders inside the assistant message column except the `<Bot />` avatar.

## Goals / Non-Goals

**Goals:**
- Show an immediate, localized thinking indicator (`Loader2` spinner + `t.workbench.thinking`) on the latest assistant turn while `isStreaming` is true and no `text`, `diagram`, `questionGroup`, `error`, or `running` `ActivityRow` is currently displayed.
- Automatically hide the indicator as soon as a `running` tool activity, `text_delta`, `diagram`, `question_group`, `error`, or `done` arrives.

**Non-Goals:**
- Streaming model internal reasoning/thoughts to the UI.

## Decisions

1. **Condition for showing the thinking indicator (`WorkbenchApp.tsx`):**
   - **Chosen approach**: Render the indicator on the active turn when `isStreaming && idx === currentTurns.length - 1 && !turn.error && !turn.text && turn.diagrams.length === 0 && !turn.questionGroup && !turn.activities.some((a) => a.status === "running")`.
   - **Why**: Avoids duplicate spinners when an `ActivityRow` is already `running`, while still covering both the initial pre-tool wait and any pause after tool calls finish before prose begins.

## Risks / Trade-offs

- [None significant] → Purely presentational state derived from existing `isStreaming` and `turn` fields.
