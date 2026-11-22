# Proposal

## Why

When starting a new stage or sending a message, the assistant turn is appended with empty `text` and `activities`, leaving only a `<Bot />` avatar next to blank space while the LLM thinks before its first tool call or token. This makes the interface look frozen to non-technical users.

## What Changes

- Add a localized `thinking` indicator string to `src/lib/i18n/types.ts`, `en.ts`, `es.ts`, and `ca.ts`.
- Render a compact animated thinking/working indicator inside the active streaming assistant turn in `src/components/workbench/WorkbenchApp.tsx` whenever `isStreaming` is active, no error is shown, no text/diagram/question card has appeared yet, and no `running` `ActivityRow` is already spinning.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `liquid-agent-ui`: Display an immediate localized thinking/working indicator while an assistant turn is streaming before the first text token or active tool indicator appears.

## Impact

- `src/components/workbench/WorkbenchApp.tsx`
- `src/lib/i18n/types.ts`, `en.ts`, `es.ts`, `ca.ts`
- `src/components/workbench/__tests__/` (component or i18n test coverage)
