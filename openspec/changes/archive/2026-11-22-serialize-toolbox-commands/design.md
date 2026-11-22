# Design

## Context

See `proposal.md` for motivation. `ai` SDK `streamText` executes all tool calls within a single LLM step concurrently.

## Goals / Non-Goals

**Goals:**
- Guarantee sequential execution of `WorkspaceToolbox.runCommand` calls per `WorkspaceToolbox` instance.
- Ensure a failed/rejected command never poisons the queue for subsequent commands.

**Non-Goals:**
- Serializing `readFile` or `listDir`.

## Decisions

1. **Per-instance promise queue (`this.commandQueue`):**
   - **Chosen approach**: Chain each `runCommand` onto `this.commandQueue` via `const run = this.commandQueue.then(() => this.executeCommand(command)); this.commandQueue = run.then(() => undefined, () => undefined); return run;`.
   - **Why**: Simple, zero-dependency, preserves exact invocation order, and ensures a rejected `CommandNotAllowedError` does not block later commands.

## Risks / Trade-offs

- [None significant] → Only affects concurrent `runCommand` calls within the same turn.
