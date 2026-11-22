# Tasks

## 1. Environment & Project Creation Backend

- [x] 1.1 Document `TEMPLATE_REPO_URL` and `PROJECTS_ROOT_DIR` in `.env.example`, and add `parseWorkspaceEnv` to `src/lib/env.ts` with default fallbacks; verify unit tests cover default and custom `.env` values.
- [x] 1.2 Implement `slugifyProjectName` and `createWorkspaceFromTemplate` in `src/lib/workspace/create.ts` (`git clone --depth 1`, strip `.git`, `git init`, cleanup on failure); verify unit tests cover slugification (accents, symbols, empty), collision rejection, and cloning from a local bare/template git repo.
- [x] 1.3 Implement `POST /api/workspace/create` in `src/app/api/workspace/create/route.ts` accepting `projectName` and `locale`, returning `WorkspaceState` + `WorkspaceArtifacts` on success and localized errors on failure; verify route tests cover valid creation and error cases.

## 2. Two-Mode Workspace UI & Localization

- [x] 2.1 Add localized UI copy and validation error strings for new project creation to `src/lib/i18n/types.ts`, `en.ts`, `es.ts`, and `ca.ts`; verify TypeScript compilation.
- [x] 2.2 Update `WorkspaceHeader.tsx` and `WorkbenchApp.tsx` with the **Open Existing** / **Create New** mode switcher wired to `POST /api/workspace/create`; verify component tests cover switching to Create New mode and submitting a project name.

## 3. Verification & Documentation

- [x] 3.1 Run `npx tsc --noEmit`, `npm test`, and `npm run build` across `dept-app-workbench`, and update `README.md` with `TEMPLATE_REPO_URL`, `PROJECTS_ROOT_DIR`, and the Create New Project workflow.
