# Proposal

## Why

When the assistant proposes structured domain models (fields, states, business rules) and asks the user to confirm or adjust them, the current Web UI Adapter contract pushes it to put everything inside `ask_questions` instead of Markdown, leaving the user without visible proposals if the card is omitted or ill-suited for tabular/list content. Additionally, `streamText` continues into a second LLM step after `ask_questions` executes, concatenating follow-up prose without spacing onto the preceding sentence, and the client drops `questionGroup` context from `priorHistory` whenever an assistant turn also contains text.

## What Changes

- Clarify the Web UI Adapter contract in `src/lib/agent/prompt-builder.ts` to separate **informative proposals** (rendered as Markdown lists/tables or Mermaid diagrams via `render_diagram`) from **interactive questions** (emitted via `ask_questions` strictly for confirmation or targeted input controls).
- Stop the agent turn cleanly when `ask_questions` is invoked in `src/lib/agent/turn-runner.ts` / `src/lib/tools/stage-tools.ts` so a post-tool LLM step cannot concatenate trailing text onto the preceding text block, and add basic error/diagnostic logging for unhandled tool-call failures in `fullStream`.
- Preserve `questionGroup` summaries in `priorHistory` inside `src/components/workbench/WorkbenchApp.tsx` even when the assistant turn also includes non-empty `text`.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `liquid-agent-ui`: Clarify that informative domain proposals are rendered in Markdown/diagrams while `ask_questions` pauses the turn for interactive confirmation/input, and ensure multi-turn history retains both assistant prose and question card summaries.

## Impact

- `src/lib/agent/prompt-builder.ts` (`WEB_ADAPTER_CONTRACT`)
- `src/lib/agent/turn-runner.ts` (`createAgentTurnStream` / `streamText` loop)
- `src/lib/tools/stage-tools.ts` (`ask_questions` tool definition/handling)
- `src/components/workbench/WorkbenchApp.tsx` (`priorHistory` construction)
- `src/lib/agent/__tests__/prompt-builder.test.ts` and `src/lib/agent/__tests__/turn-runner.test.ts`
