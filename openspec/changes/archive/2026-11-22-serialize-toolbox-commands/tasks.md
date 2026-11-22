# Tasks

## 1. Sequential Command Execution in WorkspaceToolbox

- [x] 1.1 Add a per-instance promise queue in `WorkspaceToolbox.runCommand` (`src/lib/tools/workspace-toolbox.ts`) so concurrent calls execute sequentially without poisoning the queue on errors, add a concurrency order test in `src/lib/tools/__tests__/workspace-toolbox.test.ts`, and verify with `npx tsc --noEmit` and `npm test`.
