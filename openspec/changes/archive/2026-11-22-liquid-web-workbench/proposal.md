# Proposal

## Why
Non-technical users (business stakeholders and functional analysts) need a friendly, visual way to run the `dept-app-brief` functional interview and the subsequent OpenSpec lifecycle (`explore`, `propose`, `apply-change`, `archive`) without opening an IDE or reading raw Markdown and terminal ASCII art. Building a standalone local workstation web workbench keeps `dept-app-brief` clean as a pure template repository while giving users a "liquid" UI with structured question cards and visual diagrams.

## What Changes
- Create a standalone local Next.js + TypeScript + Tailwind CSS + shadcn/ui web application in `dept-app-workbench` (without PostgreSQL or corporate SSO).
- Add local project workspace selection and a 5-stage lifecycle stepper (`Brief` → `Explore` → `Propose` → `Apply` → `Archive`) with live artifact previews (`app-brief.md`, `proposal.md`, `design.md`, `specs/`, `tasks.md`).
- Implement a direct-LLM-API agent backend with SSE streaming and a thin Web Adapter layer that translates `.agents/` workflows and skills into structured UI blocks (`ask_questions` form cards and `mermaid` visual diagrams).
- Implement directory-scoped, stage-gated workspace tools (`read_file`, `write_file`, `edit_file`, `list_dir`, `run_command`) restricted to the selected local project folder.

## Capabilities

### New Capabilities
- `workspace-lifecycle`: Local project folder selection, 5-stage OpenSpec/brief state detection, and live formatted previews of `app-brief.md` and `openspec/changes/*` artifacts.
- `liquid-agent-ui`: Direct-LLM-API streaming conversation with a Web Adapter contract that renders multi-question turns as interactive Question Group Cards and diagrams as zoomable Mermaid SVGs.
- `scoped-workspace-tools`: Stage-gated, path-jailed file and CLI command execution (`openspec`, `npm`, `tsc`) against the selected local project directory.

### Modified Capabilities
<!-- None: this is a greenfield companion project. -->

## Impact
- **New Repository (`dept-app-workbench`):** Next.js App Router application, LLM SDK integration, SSE streaming Route Handler, Mermaid renderer, and shadcn/ui components.
- **Template Repository (`dept-app-brief`):** Remains completely untouched as a pure template; the workbench reads `.agents/` and `openspec/` from cloned project directories at runtime.
- **External Dependencies:** LLM provider API key configured via local `.env`, plus local `openspec` CLI and Node.js toolchain installed on the workstation.
