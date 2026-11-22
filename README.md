# dept-app-workbench

A standalone local workstation web workbench that gives business stakeholders, functional analysts, and developers a visual, zero-IDE browser interface for running the **`dept-app-brief`** functional interview and the full **OpenSpec** lifecycle (**Brief → Explore → Propose → Apply → Archive**).

Instead of working in raw Markdown and terminal ASCII art, users interact with a **Liquid UI** featuring structured multi-question form cards, zoomable Mermaid SVG diagrams, live artifact previews, and compact tool-activity indicators — while keeping target project `.agents/` workflows and skills completely untouched.

---

## Key Features

- **Local Workspace Selection & Creation**
  - **Open Existing Project:** Point the workbench at any local cloned `dept-app-brief` or OpenSpec project directory (validated for `.agents/` or `openspec/`).
  - **Create New Project:** Enter a project name and the workbench automatically creates a sanitized hyphenated folder under `PROJECTS_ROOT_DIR`, clones `TEMPLATE_REPO_URL`, initializes a fresh Git repository (`git init`), and opens the `Brief` stage.
  - Automatically inspects `app-brief.md` and `openspec/changes/` to detect project readiness and highlight progress across the 5-stage stepper: **Brief → Explore → Propose → Apply → Archive**.
- **Liquid Conversational UI**
  - **Question Group Cards (`ask_questions`)**: Multi-question agent turns render as interactive form cards supporting `text`, `single_choice`, `multi_choice`, and `confirm` inputs with a single submission action and a locked read-only summary after submission.
  - **Visual Mermaid Diagrams (`render_diagram` & fenced `mermaid` blocks)**: Client-side SVG rendering with zoom in/out/reset controls, a raw-source toggle, and a non-blocking fallback view for invalid syntax.
  - **Streaming Tool Activity Indicators**: Real-time SSE streaming with compact status badges (and expandable details) as the agent inspects or updates workspace files.
- **Multilingual Support (English, Spanish & Catalan)**
  - Automatically detects the system/browser language (`ca*` → Catalan, `es*` → Spanish, fallback `en`) and provides a persistent `EN | ES | CA` switcher in the header.
  - Localizes the full UI, workspace validation messages, tool-activity labels, and AI assistant turns (including Question Group Cards, diagram labels, and generated artifacts).
- **Live Artifact Inspector**
  - Side panel displaying formatted previews of `app-brief.md`, `proposal.md`, `design.md`, `specs/`, and `tasks.md` progress, automatically refreshing whenever `artifact_updated` SSE events arrive.
- **Thin Web Adapter Layer**
  - Dynamically loads `.agents/` workflows, rules, and OpenSpec skills from the selected target project at runtime and appends a lightweight Web UI Adapter contract — preserving 100% compatibility for IDE users.
- **Path-Jailed & Stage-Gated Workspace Tools**
  - All file reads, writes, edits, directory listings, and CLI commands are strictly confined to the selected `projectRoot` (rejecting `..` traversal and external absolute paths).
  - Tool availability and write/command permissions are enforced per lifecycle stage.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + strict TypeScript
- **Styling & UI:** Tailwind CSS v4, shadcn/ui primitives (Radix UI), Lucide icons, `react-markdown` (`remark-gfm`)
- **Diagrams:** Mermaid (`mermaid`)
- **LLM Integration:** Vercel AI SDK (`ai`) with `@ai-sdk/openai`, `@ai-sdk/anthropic`, and `@ai-sdk/google`
- **Validation & Testing:** Zod, Vitest, React Testing Library

> **Note:** By design, `dept-app-workbench` runs locally on `localhost` and intentionally omits PostgreSQL/Prisma and corporate SSO — all project state lives directly in the selected local project filesystem.

---

## Prerequisites

- **Node.js** 20+ and **npm**
- **`openspec` CLI** installed and available on your `PATH` (for `Explore`, `Propose`, `Apply`, and `Archive` commands)
- An API key for one supported LLM provider (**OpenAI**, **Anthropic**, or **Google Gemini**)
- A local cloned `dept-app-brief` or OpenSpec project folder to open in the workbench

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and set your provider and API key:

```bash
cp .env.example .env.local
```

| Variable | Description | Default |
| --- | --- | --- |
| `LLM_PROVIDER` | LLM provider: `openai`, `anthropic`, or `google` | `openai` |
| `LLM_MODEL` | Optional model override (e.g. `gpt-4o`, `claude-sonnet-4-20250514`, `gemini-4-hydrogen`, `gemini-2.5-flash`) | Provider default |
| `OPENAI_API_KEY` | Required when `LLM_PROVIDER=openai` | — |
| `ANTHROPIC_API_KEY` | Required when `LLM_PROVIDER=anthropic` | — |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Required when `LLM_PROVIDER=google` | — |
| `DEFAULT_WORKSPACE_PATH` | Optional default local project path prefilled in the workspace bar | — |
| `TEMPLATE_REPO_URL` | Template Git repository URL cloned when creating a new project | `https://github.com/fgabriel78/dept-app-brief.git` |
| `PROJECTS_ROOT_DIR` | Parent directory where newly created project folders are placed | Parent folder of `dept-app-workbench` |

Environment variables are validated at runtime with Zod in [`src/lib/env.ts`](src/lib/env.ts).

> **Gemini Thinking Models Note:** [`src/lib/agent/model.ts`](src/lib/agent/model.ts) automatically patches missing `thoughtSignature` fields on multi-step Gemini `functionCall` turns and sets a low default thinking depth (`thinkingLevel: "low"` for Gemini 3/4 models, `thinkingBudget: 1024` for Gemini 2.5 models) for faster tool loops.

### 3. Run the workbench

**Development mode:**

```bash
npm run dev
```

**Production build & start:**

```bash
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser, paste the path to your local cloned project folder (containing `.agents/` or `openspec/`), and click **Load**.

---

## Stage-Gated Tool Permissions

Each lifecycle stage exposes only the tools appropriate for that phase (enforced in [`src/lib/tools/stage-tools.ts`](src/lib/tools/stage-tools.ts)):

| Stage | Allowed Tools | Write / Command Restrictions |
| --- | --- | --- |
| **Brief** | `read_file`, `list_dir`, `write_file`, `ask_questions`, `render_diagram` | Writes scoped strictly to `app-brief.md`; shell commands disabled |
| **Explore** | `read_file`, `list_dir`, `run_command`, `ask_questions`, `render_diagram` | Read-only; only read-only `openspec` commands (`list`, `status`, `show`, `view`, `validate`, `instructions`) |
| **Propose** | `read_file`, `list_dir`, `write_file`, `run_command`, `ask_questions`, `render_diagram` | Writes scoped to `openspec/`; `openspec` planning commands only |
| **Apply** | `read_file`, `list_dir`, `write_file`, `edit_file`, `run_command`, `ask_questions`, `render_diagram` | Full file & CLI access (`openspec`, `npm`, `npx tsc`, etc.) confined to `projectRoot` |
| **Archive** | `read_file`, `list_dir`, `run_command`, `ask_questions` | `openspec archive` and read-only `openspec` commands only |

---

## API Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/workspace/select` | `POST` | Validates a local directory path (`.agents/` or `openspec/`) and returns detected lifecycle state + initial artifacts |
| `/api/workspace/create` | `POST` | Creates a new project folder from a project name, clones `TEMPLATE_REPO_URL`, runs `git init`, and returns initial state |
| `/api/workspace/artifacts` | `GET` | Reads and returns current workspace state and formatted artifacts for `?path=<projectRoot>` |
| `/api/agent/turn` | `POST` | Runs the direct-LLM tool loop and streams SSE events (`text_delta`, `tool_activity`, `question_group`, `diagram`, `artifact_updated`, `error`, `done`) |

---

## Project Structure

```text
dept-app-workbench/
├── openspec/
│   ├── specs/                     # Synced capability specifications
│   │   ├── liquid-agent-ui/
│   │   ├── scoped-workspace-tools/
│   │   └── workspace-lifecycle/
│   └── changes/archive/           # Archived OpenSpec changes
├── src/
│   ├── app/
│   │   ├── page.tsx               # Main workbench entry page
│   │   └── api/
│   │       ├── agent/turn/        # SSE streaming agent Route Handler
│   │       └── workspace/         # Workspace validation & artifact endpoints
│   ├── components/
│   │   ├── ui/                    # Reusable shadcn/ui primitives
│   │   └── workbench/             # WorkbenchApp, WorkspaceHeader, QuestionGroupCard,
│   │                              # MermaidDiagramCard, ArtifactInspector
│   └── lib/
│       ├── env.ts                 # Zod environment configuration
│       ├── types.ts               # Shared stage, SSE, and artifact types
│       ├── agent/                 # Model factory, Web Adapter prompt builder, SSE turn runner
│       ├── tools/                 # Path-jailed WorkspaceToolbox & stage-gated tool builder
│       └── workspace/             # Lifecycle state detector & artifact loader
├── .env.example
└── package.json
```

---

## Scripts & Verification

```bash
# Type-check with strict TypeScript
npx tsc --noEmit

# Run the Vitest unit & component test suite
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build
```

---

## OpenSpec Specifications

Formal behavioral specs for this workbench live under `openspec/specs/`:

- [`openspec/specs/workspace-lifecycle/spec.md`](openspec/specs/workspace-lifecycle/spec.md)
- [`openspec/specs/liquid-agent-ui/spec.md`](openspec/specs/liquid-agent-ui/spec.md)
- [`openspec/specs/scoped-workspace-tools/spec.md`](openspec/specs/scoped-workspace-tools/spec.md)
