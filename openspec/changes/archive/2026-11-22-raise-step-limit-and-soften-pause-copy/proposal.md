# Proposal

## Why

Implementing a full application in `Apply` routinely requires 50–80+ tool calls (file writes, `tasks.md` updates, typechecks, and builds), so `maxSteps: 25` is still reached mid-build and exposes technical jargon (*"máximo de pasos de este turno"*) to non-technical users.

## What Changes

- Raise `maxSteps` in `src/lib/agent/turn-runner.ts` (`100` for `apply`, `40` for `propose`, `20` for other stages) so normal runs complete in a single turn without hitting the safety cap.
- Replace the technical `stepLimitReached` copy in `src/lib/i18n/{en,es,ca}.ts` with natural, jargon-free pause phrasing (no mention of "steps" or "turns").

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `liquid-agent-ui`: Update the step-limit pause copy to avoid technical jargon and raise the default step budget so `Apply` and `Propose` runs complete normally.

## Impact

- `src/lib/agent/turn-runner.ts`
- `src/lib/i18n/en.ts`, `es.ts`, `ca.ts`
- `src/lib/agent/__tests__/turn-runner.test.ts`
