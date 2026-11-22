# Design

## Context
See `proposal.md` for motivation and `specs/workspace-lifecycle/spec.md` for behavioral requirements. Today `WorkspaceHeader` only renders a single folder-path form backed by `POST /api/workspace/select`, and `src/lib/env.ts` only reads `DEFAULT_WORKSPACE_PATH` alongside LLM provider settings.

## Goals / Non-Goals
**Goals:**
- Allow non-technical users to create a ready-to-use project by entering only a project name.
- Keep template repository URL (`TEMPLATE_REPO_URL`) and target parent directory (`PROJECTS_ROOT_DIR`) transparent to the end user via `.env` configuration with safe defaults.
- Ensure every newly created project has a clean Git repository (`git init`) detached from the template repository's commit history and `origin` remote.

**Non-Goals:**
- Creating remote GitHub repositories or pushing to Git remotes on project creation.
- Exposing template URL editing in the UI (kept in `.env` as an administrator/workstation setting).

## Decisions

### 1. Environment Configuration (`src/lib/env.ts` & `.env.example`)
- **Decision:** Add two optional variables to `envSchema` in `src/lib/env.ts` (and a lightweight `parseWorkspaceEnv()` helper so workspace endpoints work even if an LLM key hasn't been configured yet):
  - `TEMPLATE_REPO_URL`: defaults to `"https://github.com/fgabriel78/dept-app-brief.git"`
  - `PROJECTS_ROOT_DIR`: defaults to `path.resolve(process.cwd(), "..")` (the parent directory of `dept-app-workbench`, e.g., `C:\Users\<user>\Dev`) when omitted.
- **Rationale:** Works out of the box with zero extra setup while letting teams point to an internal Git mirror or a dedicated projects directory. Separating workspace env parsing from LLM API key validation ensures project creation/selection never fails with an LLM key error.

### 2. Project Name Sanitization (`slugifyProjectName`)
- **Decision:** Normalize Unicode with `.normalize("NFD")`, strip combining diacritics (`[\u0300-\u036f]`), lowercase, replace non-`[a-z0-9]` runs with `"-"`, and trim leading/trailing hyphens. Reject if the resulting slug is empty.
- **Rationale:** Handles Spanish/Catalan accents (`"Gestió d'Incidències"` → `"gestio-d-incidencies"`) and Windows/POSIX filename restrictions cleanly.

### 3. Safe Git Clone + Re-Initialization (`src/lib/workspace/create.ts`)
- **Decision:** Use Node's `execFile` (no shell interpolation) to run:
  1. `git clone --depth 1 <templateRepoUrl> <targetDir>`
  2. Remove `<targetDir>/.git` (`fs.rmSync(..., { recursive: true, force: true })`)
  3. `git init` with `cwd: targetDir`
  On any failure, clean up `<targetDir>` if it was created during the call and return a localized error.
- **Rationale:** Argument arrays prevent shell injection from user input or URLs; stripping `.git` + `git init` prevents users from accidentally pushing app commits to `dept-app-brief`.

### 4. Two-Mode Workspace UI (`WorkspaceHeader.tsx`)
- **Decision:** Add a compact segmented toggle in `WorkspaceHeader` (**Open Existing** / **Create New**) switching the form between:
  - Existing folder path input + **Open Project** (`POST /api/workspace/select`)
  - Project name input + **Create Project** (`POST /api/workspace/create`)
- **Rationale:** Keeps the workspace bar compact, familiar, and zero-friction for non-technical users.

## Risks / Trade-offs
- **Slow or offline network during `git clone`:** Cloning from GitHub requires network access → **Mitigation:** `--depth 1` minimizes clone time; `TEMPLATE_REPO_URL` also accepts a local filesystem path for offline/air-gapped workstations; clear localized error on failure.
- **Windows file locks when deleting `.git`:** Occasionally antivirus/indexers hold handles briefly → **Mitigation:** `fs.rmSync(..., { recursive: true, force: true, maxRetries: 3 })`.
