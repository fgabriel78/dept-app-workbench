# Proposal

## Why

During multi-turn conversations (such as `explore`), the assistant can claim in prose that it prepared a visual diagram without actually invoking `render_diagram` or emitting a ```` ```mermaid ```` block, leaving the user with no diagram on screen. Contributing factors include conflicting ASCII-diagram instructions in `.agents/skills/openspec-explore/SKILL.md`, lack of an explicit prompt rule against claiming unemitted diagrams, and omitting emitted `diagrams` from `priorHistory`.

## What Changes

- Reinforce `WEB_ADAPTER_CONTRACT` in `src/lib/agent/prompt-builder.ts` so its visual-diagram rules explicitly override any `.agents/` ASCII-diagram guidance and forbid claiming a diagram was prepared unless `render_diagram` or a ```` ```mermaid ```` block was actually emitted in that turn.
- Preserve rendered `diagrams` summaries in `priorHistory` inside `src/components/workbench/WorkbenchApp.tsx` so subsequent turns know which diagrams were already rendered.
- Add server-side `tool-call` / `tool-result` diagnostic logging in `src/lib/agent/turn-runner.ts` so omitted or failed tool calls are visible in dev/server logs.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `liquid-agent-ui`: Ensure visual-diagram instructions forbid claiming unemitted diagrams, override conflicting `.agents/` ASCII rules, and preserve rendered diagram context in multi-turn history.

## Impact

- `src/lib/agent/prompt-builder.ts` (`WEB_ADAPTER_CONTRACT`)
- `src/components/workbench/WorkbenchApp.tsx` (`priorHistory`)
- `src/lib/agent/turn-runner.ts` (`fullStream` diagnostic logging)
- `src/lib/agent/__tests__/prompt-builder.test.ts` and `src/lib/agent/__tests__/turn-runner.test.ts`
