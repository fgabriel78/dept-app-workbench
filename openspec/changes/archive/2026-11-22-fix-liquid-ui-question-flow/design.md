# Design

## Context

See `proposal.md` for motivation. Three concrete behaviors in the current implementation interact poorly:

1. `WEB_ADAPTER_CONTRACT` in `src/lib/agent/prompt-builder.ts` instructs the model to use `ask_questions` instead of bulleted text whenever asking the user anything, without distinguishing informative proposals (lists/tables of proposed fields and rules) from interactive input controls.
2. `createAgentTurnStream` in `src/lib/agent/turn-runner.ts` calls `streamText` with `maxSteps: 8`, and `ask_questions` in `src/lib/tools/stage-tools.ts` defines an `execute` function returning `{ status: "awaiting_user_response" }`. Because `execute` resolves with a tool result, `streamText` triggers another LLM step that streams trailing text directly onto the previous `text_delta` stream with no separator.
3. `priorHistory` in `src/components/workbench/WorkbenchApp.tsx` checks `if (text.length > 0)` before checking `tEntry.questionGroup`, dropping the question card summary whenever an assistant turn also has text.

## Goals / Non-Goals

**Goals:**
- Ensure proposed domain fields, states, and business rules are always rendered visibly in Markdown or Mermaid diagrams, while `ask_questions` handles only interactive confirmation/input controls.
- Stop the `streamText` turn cleanly once `ask_questions` is called so no post-tool step concatenates trailing text.
- Preserve both `text` and `questionGroup` summary in `priorHistory` across turns.
- Log unexpected `fullStream` errors or tool-call failures in `turn-runner.ts` for server-side diagnostics.

**Non-Goals:**
- Persisting chat turns (`turnsByStage`) to disk or a database.
- Redesigning `QuestionGroupCard` input types beyond `text`, `single_choice`, `multi_choice`, and `confirm`.

## Decisions

1. **Stopping `streamText` on `ask_questions` via `experimental_activeTools` / `abort` vs omitting `execute` vs `onStepFinish`:**
   - **Chosen approach**: Handle `ask_questions` as a turn-terminating tool in `turn-runner.ts` — either by omitting `execute` on `ask_questions` and emitting `question_group` when `part.type === "tool-call"` for `ask_questions` arrives in `fullStream` (in AI SDK v4, a tool without `execute` stops the `maxSteps` loop after emitting `tool-call`), OR by passing an `AbortController` / step check if `execute` is retained.
   - **Why**: Omitting `execute` (or handling `tool-call` directly) is the native AI SDK pattern for human-in-the-loop UI tools that pause for user input; it guarantees no extra LLM round-trip is billed or streamed after `ask_questions`. Note: existing tests in `turn-runner.test.ts` use `MockLanguageModelV1` and should be updated/verified to match the chosen mechanism.

2. **Prompt contract separation (`WEB_ADAPTER_CONTRACT`):**
   - **Chosen approach**: Update rule 1 in `prompt-builder.ts` to explicitly state that **proposals** (fields, states, rules, tables, summaries) MUST be written in Markdown (or `render_diagram`) in the message body, and `ask_questions` MUST be used for the interactive confirmation or follow-up questions. Remove or soften the instruction *"finish your turn briefly"* if `ask_questions` itself terminates the turn, or clarify that prose precedes `ask_questions`.
   - **Alternative considered**: Adding a new `proposal_card` UI tool. Rejected as unnecessary complexity when Markdown tables/lists and `MermaidDiagramCard` already render proposals cleanly.

3. **Preserving `questionGroup` in `priorHistory` (`WorkbenchApp.tsx`):**
   - **Chosen approach**: When building `priorHistory` for an assistant turn, concatenate `text` and the `questionSummaryPrefix(...)` whenever both are present, separated by `\n\n`, instead of `if (text.length > 0) return ...` early.

4. **Server-side diagnostics (`turn-runner.ts`):**
   - **Chosen approach**: Log `part.error` on `part.type === "error"` with `console.error("[agent/turn]", ...)` so Next.js dev/server logs capture tool validation or provider errors even if the client stream closes.

## Risks / Trade-offs

- [Changing `ask_questions` to omit `execute` affects `MockLanguageModelV1` multi-step test in `turn-runner.test.ts`] → Update `turn-runner.test.ts` so `ask_questions` is tested as the final step of a turn (and verify that a second step is NOT invoked after `ask_questions`).
- [LLMs might still occasionally write a closing sentence before calling `ask_questions`] → Writing a closing phrase *before* `ask_questions` is fine as long as the proposal precedes it and no post-tool step concatenates onto it without spacing.
