# Design

## Context

See `proposal.md` for motivation. Three gaps contribute to the missing-diagram symptom:
1. `.agents/skills/openspec-explore/SKILL.md` instructs *"Draw with plain ASCII only"*, while `WEB_ADAPTER_CONTRACT` in `src/lib/agent/prompt-builder.ts` instructs *"Never draw ASCII-art diagrams"*, without stating precedence or forbidding prose claims about unemitted diagrams.
2. `priorHistory` in `src/components/workbench/WorkbenchApp.tsx` preserves `text` and `questionGroup`, but omits `turn.diagrams`.
3. `fullStream` in `src/lib/agent/turn-runner.ts` does not log tool calls, making it invisible in server logs whether `render_diagram` was actually invoked.

## Goals / Non-Goals

**Goals:**
- Make `WEB_ADAPTER_CONTRACT` explicitly take precedence over `.agents/` ASCII-diagram rules and prohibit claiming a diagram exists unless `render_diagram` or a ```` ```mermaid ```` block was emitted in the same turn.
- Include rendered `diagrams` summaries in `priorHistory` in `WorkbenchApp.tsx`.
- Log `tool-call` names in `turn-runner.ts` (`console.debug` / `console.info` in non-test environments or `console.info`) for server-side diagnostics.

**Non-Goals:**
- Re-prompting the LLM automatically if prose mentions "diagram" without a tool call (too brittle across languages and false positives).

## Decisions

1. **Prompt precedence & honesty rule (`prompt-builder.ts`):**
   - **Chosen approach**: Update rule 2 in `WEB_ADAPTER_CONTRACT` to state that its visual-diagram contract overrides any `.agents/` skill/workflow ASCII instructions, and that the assistant must never state it prepared/showed a diagram unless it actually called `render_diagram` or emitted a ```` ```mermaid ```` block in that turn.

2. **Diagram context in `priorHistory` (`WorkbenchApp.tsx`):**
   - **Chosen approach**: Extract/extend the assistant history formatting so `tEntry.diagrams` appends `[Diagram rendered: <title>]` (using a localized or neutral label) alongside `text` and `questionSummary`.

3. **Tool-call diagnostics (`turn-runner.ts`):**
   - **Chosen approach**: In `for await (const part of result.fullStream)`, log `part.toolName` on `part.type === "tool-call"` when `process.env.NODE_ENV !== "test"` so Vitest output stays clean while `next dev` logs every tool invocation.

## Risks / Trade-offs

- [LLM can still occasionally forget a tool call under `thinkingLevel: "low"`] → Prompt precedence + honest-reference rule + `priorHistory` context significantly reduce it, and server logs make any remaining occurrence immediately diagnosable.
