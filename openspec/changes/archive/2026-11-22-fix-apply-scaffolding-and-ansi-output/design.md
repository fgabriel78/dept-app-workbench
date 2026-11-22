# Design

## Context

See `proposal.md` for motivation. Currently:
1. Workspaces created from `dept-app-brief` contain `.agents/`, `openspec/`, `app-brief.md`, `app-brief-example.md`, and `README.md` in the root.
2. `STAGE_OBJECTIVES` in `src/lib/agent/prompt-builder.ts` does not warn the agent about these pre-existing files, so `propose` and `apply` attempt `npx create-next-app@latest .` (which aborts on non-empty directories).
3. `WorkspaceToolbox.runCommand` in `src/lib/tools/workspace-toolbox.ts` returns raw `stdout` and `stderr` including ANSI escape codes (`\x1b[32m`, etc.) that render as `[32m` in `ActivityRow`.

## Goals / Non-Goals

**Goals:**
- Guide `propose` and `apply` in `prompt-builder.ts` to initialize `package.json` (`npm init -y` + `npm install`) and write config/source files directly without running empty-dir CLI generators on `.`.
- Strip ANSI escape sequences in `WorkspaceToolbox.runCommand` for both exit code `0` and error paths.

**Non-Goals:**
- Moving user application code into a separate subfolder by default.

## Decisions

1. **Direct initialization guidance in `STAGE_OBJECTIVES.propose` and `STAGE_OBJECTIVES.apply`:**
   - **Chosen approach**: Explicitly state that the workspace root is non-empty (`.agents/`, `openspec/`, `app-brief.md`, `README.md`) and instruct the agent to use `npm init -y`, `npm install`, and `write_file` directly rather than `create-next-app .` or `create-vite .`.

2. **ANSI stripping in `WorkspaceToolbox.runCommand`:**
   - **Chosen approach**: Add a small `stripAnsi(text: string): string` helper using `/\x1B\[[0-9;?]*[ -/]*[@-~]/g` and apply it to `stdout` and `stderr` in `runCommand` (both success and catch branches).

## Risks / Trade-offs

- [None significant] → Purely additive prompt guidance and output sanitization.
