# Tasks

## 1. Prompt Contract Separation

- [x] 1.1 Update `WEB_ADAPTER_CONTRACT` in `src/lib/agent/prompt-builder.ts` so informative proposals (fields, states, business rules, tables) are explicitly written in Markdown or `render_diagram` before calling `ask_questions` for confirmation/input, and verify `src/lib/agent/__tests__/prompt-builder.test.ts` passes with assertions covering the updated contract.

## 2. Clean Turn Termination on `ask_questions` and Diagnostics

- [x] 2.1 Update `ask_questions` in `src/lib/tools/stage-tools.ts` and the `fullStream` loop in `src/lib/agent/turn-runner.ts` so invoking `ask_questions` emits `question_group` and terminates the `streamText` turn without triggering a post-tool LLM step, and add `console.error` logging on `part.type === "error"`.
- [x] 2.2 Update `src/lib/agent/__tests__/turn-runner.test.ts` to verify that `ask_questions` emits `question_group`, stops the turn before a second LLM step runs, and no trailing text is concatenated; run `npx vitest run src/lib/agent/__tests__/turn-runner.test.ts src/lib/tools/__tests__/stage-tools.test.ts` to confirm passing.

## 3. Preserve Question Card Context in Conversation History

- [x] 3.1 Update `priorHistory` construction in `src/components/workbench/WorkbenchApp.tsx` so assistant turns with both `text` and `questionGroup` include both the prose and the question summary separated by a blank line, and verify with `npx tsc --noEmit` and `npm test`.
