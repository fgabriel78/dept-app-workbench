# Design

## Context

See `proposal.md` for motivation. Currently:
1. `.agents/workflows/dept-app-brief.md` (cloned into user workspaces) instructs the assistant to display `app-brief.md` inside a ```` ```markdown ... ``` ```` fenced block.
2. `splitMarkdownAndMermaid` in `src/components/workbench/WorkbenchApp.tsx` only extracts ```` ```mermaid ```` blocks and passes everything else to `ReactMarkdown`.
3. `ReactMarkdown`'s container in `WorkbenchApp.tsx` has minimal utility classes (`[&_ul]`, `[&_ol]`, `[&_code]`), lacking heading, table, blockquote, and `<pre>` containment styles (and `@tailwindcss/typography` is not installed).

## Goals / Non-Goals

**Goals:**
- Ensure `WEB_ADAPTER_CONTRACT` instructs the assistant not to wrap documents/summaries in ```` ```markdown ```` fenced blocks.
- Unwrap ```` ```markdown ```` / ```` ```md ```` fenced blocks in the UI renderer as a safety net so workflow templates still render as rich Markdown.
- Style headings (`h1`–`h3`), emphasis (`strong`, `em`), lists, blockquotes, horizontal rules, tables, and `<pre>` code blocks cleanly within the message card without horizontal overflow.

**Non-Goals:**
- Modifying the external `dept-app-brief` template repository or already-cloned user workspace `.agents/` files.
- Adding `@tailwindcss/typography` as a new dependency when targeted Tailwind utility selectors in the message container (or a small extracted component) suffice.

## Decisions

1. **Unwrapping ```` ```markdown ```` / ```` ```md ```` blocks in `WorkbenchApp.tsx`:**
   - **Chosen approach**: Extract/export a pure helper (e.g., `normalizeAgentMarkdown` or extend `splitMarkdownAndMermaid` in a small helper module or `WorkbenchApp.tsx`) that unwraps top-level ```` ```markdown ... ``` ```` and ```` ```md ... ``` ```` blocks (supporting `\r\n` or `\n` line endings and optional trailing spaces after the language tag), while leaving ```` ```mermaid ```` and other language code blocks (e.g. `sql`, `json`, `ts`) intact.
   - **Why**: Handling this in a pure exported helper makes it trivially unit-testable with Vitest without needing to mount the entire `WorkbenchApp` with network mocks.

2. **Typography and overflow containment without adding dependencies:**
   - **Chosen approach**: Apply Tailwind arbitrary-variant classes (or `ReactMarkdown` `components` overrides for `table` / `pre`) on the Markdown container in `WorkbenchApp.tsx`, including `min-w-0 max-w-full overflow-hidden` on the card wrapper, `overflow-x-auto` wrapper around `<table>` and `<pre>`, `whitespace-pre-wrap break-words` or horizontal scroll on `<pre>`, and clean spacing/weights for `h1`, `h2`, `h3`, `p`, `blockquote`, `hr`, `th`, `td`.
   - **Alternative considered**: Installing `@tailwindcss/typography`. Rejected to avoid a dependency change for a single message bubble container.

## Risks / Trade-offs

- [A fenced ```` ```markdown ```` block could contain a nested ```` ```mermaid ```` block] → Unwrap ```` ```markdown ```` / ```` ```md ```` *before* running `splitMarkdownAndMermaid`, so nested Mermaid blocks are also rendered as `MermaidDiagramCard`.
- [An assistant intentionally shows a short Markdown syntax example] → Rare in business-stakeholder workbench conversations; the benefit of rendering brief deliverables cleanly outweighs showing raw Markdown syntax.
