# Proposal

## Why

Workflow templates such as `dept-app-brief.md` instruct the agent to display final documents (e.g., `app-brief.md`) inside a fenced ```` ```markdown ```` code block. In the web workbench, `ReactMarkdown` renders that block as literal `<pre><code>` text without formatting, and missing `<pre>`/`<table>` overflow and typography styles cause long lines to overflow past the right border of the message card.

## What Changes

- Update `WEB_ADAPTER_CONTRACT` in `src/lib/agent/prompt-builder.ts` so the agent renders document deliverables and summaries directly as formatted Markdown rather than wrapping them inside ```` ```markdown ```` fenced code blocks.
- Update message rendering in `src/components/workbench/WorkbenchApp.tsx` to unwrap ```` ```markdown ```` / ```` ```md ```` fenced blocks into rendered Markdown, add rich typography styles (headings, bold/italic, lists, blockquotes, tables, horizontal rules), and enforce horizontal containment (`overflow-x-auto`, `max-w-full`) on `<pre>` and `<table>` elements so content stays aligned inside the message card.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `liquid-agent-ui`: Require rich, card-contained Markdown rendering for assistant prose and document deliverables, unwrapping fenced `markdown`/`md` code blocks and preventing horizontal overflow.

## Impact

- `src/lib/agent/prompt-builder.ts` (`WEB_ADAPTER_CONTRACT`)
- `src/components/workbench/WorkbenchApp.tsx` (`splitMarkdownAndMermaid` / markdown container styling)
- `src/lib/agent/__tests__/prompt-builder.test.ts`
- `src/components/workbench/__tests__/` (new or updated unit test for Markdown rendering/unwrapping)
