# Tasks

## 1. Core i18n Module & System Locale Detection

- [x] 1.1 Create `src/lib/i18n/types.ts`, `src/lib/i18n/en.ts`, `src/lib/i18n/es.ts`, `src/lib/i18n/ca.ts`, and `src/lib/i18n/index.ts` defining `SUPPORTED_LOCALES` (`en`, `es`, `ca`), `resolveSystemLocale`, `getDictionary`, and complete typed translation dictionaries; verify unit tests cover `ca*`, `es*`, and fallback `en` locale resolution.
- [x] 1.2 Create `src/components/workbench/I18nProvider.tsx` with hydration-safe system locale detection, `localStorage` persistence (`dept-app-workbench.locale`), `document.documentElement.lang` synchronization, and `useI18n()` hook; verify component tests confirm initial system detection and manual switching.

## 2. Backend & Agent Locale Support

- [x] 2.1 Update `validateWorkspaceRoot` and `inspectWorkspaceState` in `src/lib/workspace/state.ts` plus `POST /api/workspace/select` and `GET /api/workspace/artifacts` to accept `locale` and return localized validation errors and stage metadata; verify tests cover `en`, `es`, and `ca` validation responses.
- [x] 2.2 Update `buildStageTools` in `src/lib/tools/stage-tools.ts` to accept `locale` and emit localized tool-activity labels (`read_file`, `list_dir`, `write_file`, `edit_file`, `run_command`); verify unit tests confirm localized activity labels.
- [x] 2.3 Update `buildWebAdapterPrompt` in `src/lib/agent/prompt-builder.ts`, `createAgentTurnStream` in `src/lib/agent/turn-runner.ts`, and `POST /api/agent/turn` to accept `locale` and inject a mandatory response-language directive for agent prose, `ask_questions`, `render_diagram`, and generated artifacts; verify unit tests cover `en`, `es`, and `ca` prompts.

## 3. Frontend UI Localization & Language Switcher

- [x] 3.1 Add the `EN | ES | CA` language switcher to `WorkspaceHeader.tsx` and localize all header, workspace selector, and 5-stage stepper strings; verify `WorkspaceHeader` tests pass for switching locales.
- [x] 3.2 Localize `WorkbenchApp.tsx`, `QuestionGroupCard.tsx`, `MermaidDiagramCard.tsx`, and `ArtifactInspector.tsx` (including stage starter prompts, composer placeholders, `Yes`/`No`/`Submit Answers`/`Submitted`, zoom/source/fallback labels, and artifact empty states), passing `locale` on API requests; verify all component tests pass.

## 4. End-to-End Verification & Documentation

- [x] 4.1 Run `npx tsc --noEmit`, `npm test`, and `npm run build` across `dept-app-workbench`, update `README.md` with multilingual support details, and verify the `EN | ES | CA` switcher and system locale detection work cleanly.
