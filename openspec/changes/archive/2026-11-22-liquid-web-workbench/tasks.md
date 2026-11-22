# Tasks

## 1. Project Scaffolding & UI Foundation

- [x] 1.1 Initialize Next.js (App Router, strict TypeScript), Tailwind CSS, shadcn/ui, Lucide icons, Zod, and Mermaid dependencies in `dept-app-workbench`, and verify `npm run build` succeeds.
- [x] 1.2 Add `.env.example` documenting the LLM provider API key and model configuration, and verify `src/lib/env.ts` validates required variables with Zod.

## 2. Scoped Workspace Tools & Lifecycle Detection

- [x] 2.1 Implement path-jailed `WorkspaceToolbox` (`read_file`, `write_file`, `edit_file`, `list_dir`, `run_command`) with unit tests verifying path-traversal attempts outside `projectRoot` are rejected.
- [x] 2.2 Implement stage-gated tool filtering (`brief`, `explore`, `propose`, `apply`, `archive`) with unit tests confirming write/mutating tools are excluded during `explore`.
- [x] 2.3 Implement workspace state detector (`inspectWorkspaceState`) reading `app-brief.md` and `openspec/changes/` with tests covering empty, brief-ready, proposed, and in-progress states.

## 3. Direct LLM API & Web Adapter Backend

- [x] 3.1 Implement the Web Adapter prompt builder that loads `.agents/` workflows/rules/skills from the selected project directory and injects the `ask_questions` and `mermaid` structured UI contract; verify unit tests cover each stage prompt.
- [x] 3.2 Implement `POST /api/agent/turn` SSE Route Handler executing the direct LLM tool loop and streaming text, tool-activity, question-group, diagram, and artifact-refresh events; verify via an integration test with a mocked LLM stream.
- [x] 3.3 Implement `POST /api/workspace/select` and `GET /api/workspace/artifacts` endpoints to validate local project folders and return formatted artifact contents; verify valid and invalid path responses.

## 4. Liquid Web Workbench Frontend

- [x] 4.1 Build the workspace selector bar and 5-stage lifecycle stepper (`Brief` → `Explore` → `Propose` → `Apply` → `Archive`) using shadcn/ui, verifying stage switching updates active context.
- [x] 4.2 Build the `QuestionGroupCard` component rendering `text`, `single_choice`, `multi_choice`, and `confirm` inputs per question with single-submit and read-only submitted state; verify via component tests.
- [x] 4.3 Build the `MermaidDiagramCard` component rendering Mermaid SVG with zoom controls, raw-source toggle, and invalid-syntax fallback; verify valid and invalid Mermaid inputs render cleanly.
- [x] 4.4 Build the live Artifact Inspector side panel (`app-brief.md`, `proposal.md`, `design.md`, `specs/`, `tasks.md` progress) and verify it refreshes when `artifact_updated` SSE events arrive.

## 5. End-to-End Verification

- [x] 5.1 Run `npx tsc --noEmit` and `npm run build` across `dept-app-workbench`, and manually verify a full `Brief` → `Explore` turn against a cloned `dept-app-brief` project folder.
