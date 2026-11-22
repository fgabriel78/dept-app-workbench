# Tasks

## 1. Visual Diagram Prompt Precedence & Honesty Rule

- [x] 1.1 Update `WEB_ADAPTER_CONTRACT` in `src/lib/agent/prompt-builder.ts` so visual-diagram rules explicitly override `.agents/` ASCII instructions and forbid claiming a diagram was prepared/shown unless `render_diagram` or a ```` ```mermaid ```` block was emitted in that turn; verify `src/lib/agent/__tests__/prompt-builder.test.ts` passes with assertions for both rules.

## 2. Preserve Diagram Context & Add Tool-Call Diagnostics

- [x] 2.1 Update `priorHistory` in `src/components/workbench/WorkbenchApp.tsx` to include rendered `diagrams` summaries alongside `text` and `questionGroup`, and add non-test `tool-call` diagnostic logging in `src/lib/agent/turn-runner.ts`; verify with `npx tsc --noEmit` and `npm test`.
