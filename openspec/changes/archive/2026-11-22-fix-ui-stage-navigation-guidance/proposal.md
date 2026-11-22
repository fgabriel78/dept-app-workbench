# Proposal

## Why

Loaded `.agents/skills/` files contain IDE/CLI handoff instructions (such as `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, or `openspec` commands), causing the assistant to tell non-technical workbench users to execute slash commands instead of clicking the Workbench UI stage buttons (`Brief`, `Explore`, `Propose`, `Apply`, `Archive` in the active locale).

## What Changes

- Update `src/lib/agent/prompt-builder.ts` to inject a mandatory UI-only stage-navigation rule (overriding `.agents/` slash-command and CLI handoff instructions) with the exact localized stage button labels from `getDictionary(locale).stages`.
- Add unit tests in `src/lib/agent/__tests__/prompt-builder.test.ts` verifying that the rule forbids OpenSpec slash/CLI commands and includes localized stage button labels for `en`, `es`, and `ca`.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `liquid-agent-ui`: Require agent responses to direct users exclusively to the localized Workbench UI stage buttons instead of OpenSpec slash commands or CLI commands.

## Impact

- `src/lib/agent/prompt-builder.ts`
- `src/lib/agent/__tests__/prompt-builder.test.ts`
