# Tasks

## 1. Prompt Contract Update

- [x] 1.1 Update `WEB_ADAPTER_CONTRACT` in `src/lib/agent/prompt-builder.ts` to instruct the agent never to wrap document deliverables or summaries (such as `app-brief.md`) inside ```` ```markdown ```` fenced code blocks, and verify `src/lib/agent/__tests__/prompt-builder.test.ts` passes with an assertion for this rule.

## 2. Markdown Unwrapping, Rich Typography, and Card Containment

- [x] 2.1 Add a pure helper to unwrap ```` ```markdown ```` / ```` ```md ```` fenced blocks before `splitMarkdownAndMermaid` runs in `src/components/workbench/WorkbenchApp.tsx`, and add unit tests covering unwrapping, nested Mermaid blocks, and preserving non-markdown code blocks (verify with `npx vitest run`).
- [x] 2.2 Update the assistant message card and Markdown container in `src/components/workbench/WorkbenchApp.tsx` with rich typography styles (`h1`–`h3`, `strong`, `em`, `blockquote`, `hr`, `table`/`th`/`td`) and horizontal overflow containment (`min-w-0`, `overflow-x-auto` on `<pre>` and `<table>`), and verify with `npx tsc --noEmit` and `npm test`.
