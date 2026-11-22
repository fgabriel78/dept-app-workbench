# Proposal

## Why

Workspaces created from `dept-app-brief` already contain `.agents/`, `openspec/`, `app-brief.md`, `app-brief-example.md`, and `README.md` in the root directory. During `Propose` and `Apply`, the agent often tries to run CLI scaffolders like `npx create-next-app .` or `npm create vite .` on the workspace root, which fail because the directory is non-empty, and raw ANSI escape codes in command output clutter the UI details panel.

## What Changes

- Update `STAGE_OBJECTIVES` (`propose` and `apply`) in `src/lib/agent/prompt-builder.ts` to inform the agent that the workspace root is non-empty (already containing `.agents/`, `openspec/`, `app-brief.md`, `README.md`) and instruct it never to run empty-directory CLI scaffolders (such as `create-next-app .` or `create-vite .`) on `.`, initializing `package.json` (`npm init -y` + `npm install`) and base config/source files directly instead.
- Strip ANSI escape sequences from `stdout` and `stderr` in `WorkspaceToolbox.runCommand` (`src/lib/tools/workspace-toolbox.ts`) so command details render cleanly in the UI.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `scoped-workspace-tools`: Strip ANSI escape codes from command outputs returned to the UI.
- `liquid-agent-ui`: Guide `Propose` and `Apply` stages to scaffold projects directly without failing empty-directory CLI generators on the non-empty workspace root.

## Impact

- `src/lib/agent/prompt-builder.ts`
- `src/lib/tools/workspace-toolbox.ts`
- `src/lib/agent/__tests__/prompt-builder.test.ts`
- `src/lib/tools/__tests__/workspace-toolbox.test.ts`
