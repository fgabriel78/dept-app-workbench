# Proposal

## Why
Currently, `dept-app-workbench` requires users to manually clone the `dept-app-brief` template repository and enter its local folder path before starting a session. Adding an integrated **Create New Project** option lets non-technical users create a new project by simply entering a project name, while the workbench transparently creates a sanitized folder, clones the configured template repository, and initializes a fresh Git repository.

## What Changes
- Add `TEMPLATE_REPO_URL` (defaulting to `https://github.com/fgabriel78/dept-app-brief.git`) and `PROJECTS_ROOT_DIR` (optional parent directory for newly created projects, defaulting to a safe local sibling/home directory) to `.env.example` and `src/lib/env.ts`.
- Add project-name sanitization/slugification and `POST /api/workspace/create` endpoint that creates `<PROJECTS_ROOT_DIR>/<slug>`, clones `TEMPLATE_REPO_URL`, removes the template `.git` history, runs `git init`, and returns the initialized `WorkspaceState` and `WorkspaceArtifacts`.
- Extend `WorkspaceHeader` with a two-mode workspace entry (**Open Existing Project** vs **Create New Project**) so users can either select an existing folder or create a new project by name.
- Localize all new project-creation labels, placeholders, and error messages across English (`en`), Spanish (`es`), and Catalan (`ca`).

## Capabilities

### New Capabilities
<!-- None: this extends the existing workspace-lifecycle capability. -->

### Modified Capabilities
- `workspace-lifecycle`: Add new project creation from a user-provided project name, including folder name sanitization, transparent template repository cloning (`TEMPLATE_REPO_URL`), fresh `git init`, and immediate workspace loading.

## Impact
- **Configuration (`.env.example`, `src/lib/env.ts`):** New optional `TEMPLATE_REPO_URL` and `PROJECTS_ROOT_DIR` variables.
- **Backend (`src/lib/workspace/`, `src/app/api/workspace/create/route.ts`):** New `createWorkspaceFromTemplate` helper and `POST /api/workspace/create` Route Handler.
- **Frontend (`src/components/workbench/WorkspaceHeader.tsx`, `WorkbenchApp.tsx`, `src/lib/i18n/`):** Two-mode selector/creator UI and `en`/`es`/`ca` translations.
- **External Dependencies:** Requires `git` CLI available on the workstation `PATH` when creating a new project.
