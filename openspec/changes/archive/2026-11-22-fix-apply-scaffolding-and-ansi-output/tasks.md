# Tasks

## 1. Non-Empty Workspace Scaffolding Guidance

- [x] 1.1 Update `STAGE_OBJECTIVES.propose` and `STAGE_OBJECTIVES.apply` in `src/lib/agent/prompt-builder.ts` to inform the agent that the workspace root already contains `.agents/`, `openspec/`, `app-brief.md`, and `README.md` and instruct it not to run empty-directory CLI scaffolders (`create-next-app .`, `create-vite .`) on `.`, initializing `package.json` and project files directly instead; add assertions in `src/lib/agent/__tests__/prompt-builder.test.ts` and verify with `npx vitest run src/lib/agent/__tests__/prompt-builder.test.ts`.

## 2. Clean Command Output Without ANSI Escape Codes

- [x] 2.1 Strip ANSI escape sequences from `stdout` and `stderr` in `WorkspaceToolbox.runCommand` (`src/lib/tools/workspace-toolbox.ts`), add a unit test in `src/lib/tools/__tests__/workspace-toolbox.test.ts`, and verify with `npx tsc --noEmit` and `npm test`.
