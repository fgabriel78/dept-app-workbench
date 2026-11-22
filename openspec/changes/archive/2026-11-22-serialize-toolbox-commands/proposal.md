# Proposal

## Why

When the LLM emits multiple `run_command` tool calls in a single step (such as `openspec new change` and `openspec status`), the AI SDK executes them concurrently, causing the second command to fail with a race condition (`Change not found`).

## What Changes

- Serialize `WorkspaceToolbox.runCommand` executions per toolbox instance in `src/lib/tools/workspace-toolbox.ts` using a promise queue so commands always execute sequentially in invocation order (even if a previous command rejects or fails), while keeping `readFile` and `listDir` non-blocking.
- Add a concurrency test in `src/lib/tools/__tests__/workspace-toolbox.test.ts`.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- (none — internal concurrency fix; `skip_specs: true` set in `.openspec.yaml`)

## Impact

- `src/lib/tools/workspace-toolbox.ts`
- `src/lib/tools/__tests__/workspace-toolbox.test.ts`
