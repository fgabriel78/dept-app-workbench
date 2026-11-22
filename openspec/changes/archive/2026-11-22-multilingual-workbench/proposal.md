# Proposal

## Why
Business stakeholders and functional analysts using `dept-app-workbench` often work in Spanish or Catalan rather than English. Providing the workbench interface, validation feedback, and AI-guided interview/OpenSpec sessions in **English (`en`)**, **Spanish (`es`)**, and **Catalan (`ca`)**—automatically defaulting to the user's system language with an optional manual switcher—makes the zero-IDE experience immediately accessible to non-technical users in their preferred language.

## What Changes
- Add a lightweight typed i18n subsystem supporting English (`en`), Spanish (`es`), and Catalan (`ca`), with automatic detection from the browser/OS system locale (`navigator.languages` / `navigator.language`, falling back to `en`) and `localStorage` persistence.
- Add a compact `EN | ES | CA` language switcher in `WorkspaceHeader` that updates all UI labels, stage stepper titles/descriptions, empty states, starter prompts, `QuestionGroupCard`, `MermaidDiagramCard`, `ArtifactInspector`, and `<html lang>`.
- Localize workspace validation errors and tool-activity status labels based on the active locale.
- Extend `POST /api/agent/turn` and the Web Adapter prompt builder to accept the active `locale` and instruct the LLM to converse, emit `QuestionGroupCard` prompts/options, label diagrams, and author `app-brief.md` and OpenSpec artifacts in the active language.

## Capabilities

### New Capabilities
- `workbench-i18n`: System-locale detection, persisted manual language switching (`en`, `es`, `ca`), and localized UI copy, validation errors, and tool activity indicators.

### Modified Capabilities
- `liquid-agent-ui`: Respect the active workbench locale (`en`, `es`, `ca`) in agent responses, Question Group Cards, visual diagram labels, and generated artifacts.

## Impact
- **Frontend (`src/components/workbench/`, `src/app/layout.tsx`):** Add `I18nProvider` / locale context, `EN | ES | CA` switcher in `WorkspaceHeader`, and replace hardcoded English strings across workbench components.
- **i18n Module (`src/lib/i18n/`):** New locale types, system-locale detector, and typed `en`/`es`/`ca` translation dictionaries.
- **Backend & Agent (`src/lib/agent/`, `src/lib/tools/`, `src/lib/workspace/`, `src/app/api/`):** Accept optional `locale` (default `"en"`) in `/api/agent/turn` and `/api/workspace/select`, localize tool activity labels and workspace validation messages, and inject a mandatory response-language directive in `buildWebAdapterPrompt`.
