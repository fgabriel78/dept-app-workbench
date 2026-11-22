# Design

## Context
See `proposal.md` for motivation and `specs/` for behavioral requirements. Today all UI copy (`WorkspaceHeader`, `WorkbenchApp`, `QuestionGroupCard`, `MermaidDiagramCard`, `ArtifactInspector`), stage starter prompts, tool activity labels (`stage-tools.ts`), workspace validation errors (`state.ts`), and Web Adapter instructions (`prompt-builder.ts`) are hardcoded in English.

## Goals / Non-Goals
**Goals:**
- Support `en` (English), `es` (Spanish), and `ca` (Catalan) across the entire workbench UI, server validation/activity messages, and LLM agent turns.
- Detect the system locale automatically on the client (`navigator.languages` / `navigator.language`) with `localStorage` override persistence and zero hydration mismatch.
- Keep zero external i18n runtime dependencies and enforce translation key completeness at compile time via TypeScript.

**Non-Goals:**
- URL-based locale routing (`/en`, `/es`, `/ca`) — unnecessary for a single-page local workstation app.
- Translating existing `.agents/` template files on disk inside target repositories (translation/adaptation happens at runtime via the Web Adapter prompt directive).

## Decisions

### 1. Typed Dictionary i18n Module (`src/lib/i18n/`)
- **Decision:** Implement `src/lib/i18n/` with `SUPPORTED_LOCALES = ["en", "es", "ca"]`, `resolveSystemLocale(languages)`, `en.ts`, `es.ts`, `ca.ts` sharing a single strict `TranslationDictionary` TypeScript type, and a React `I18nProvider` + `useI18n()` hook.
- **Rationale:** Zero new packages, compile-time guarantee that `es` and `ca` define every key in `en`, and clean synchronous switching without page reloads.
- **Alternative considered:** `next-intl` or `i18next`. Rejected because URL subpaths and heavy runtime ICU parsers add complexity without benefit for 3 fixed locales in a single-page local workbench.

### 2. Hydration-Safe System Locale Detection + `localStorage` Override
- **Decision:** Initialize `I18nProvider` with `"en"` on initial SSR/first render, then in a client `useEffect` resolve the stored `localStorage` key (`dept-app-workbench.locale`) or fall back to `resolveSystemLocale(navigator.languages ?? [navigator.language])`, and sync `document.documentElement.lang`.
- **Rationale:** Avoids React hydration mismatches between Next.js server HTML (`lang="en"`) and browser `navigator.language` while applying the system/saved language immediately on mount.

### 3. Passing `locale` to Backend APIs & Web Adapter
- **Decision:** Add optional `locale: z.enum(SUPPORTED_LOCALES).default("en")` to `POST /api/agent/turn`, `POST /api/workspace/select`, and `GET /api/workspace/artifacts` (`?locale=`).
  - `validateWorkspaceRoot(dirPath, locale)` and `buildStageTools({ ..., locale })` look up localized strings from `getDictionary(locale)`.
  - `buildWebAdapterPrompt(projectRoot, stage, locale)` injects a `## Response Language (Mandatory)` section instructing the LLM to write all conversational prose, `ask_questions` prompts/options/placeholders, `render_diagram` labels/titles, and generated `app-brief.md` / OpenSpec artifact prose in English, Spanish, or Catalan (preserving required English OpenSpec Markdown syntax like `### Requirement:` and `#### Scenario:` when writing OpenSpec specs).
- **Rationale:** Ensures end-to-end language consistency even when target `.agents/` files are written in English or Spanish.

## Risks / Trade-offs
- **LLM following `.agents/` language instead of UI locale:** Target `dept-app-brief` templates may be in Spanish or English → **Mitigation:** Place the `## Response Language (Mandatory)` directive in both the stage objective header and the Web Adapter contract so it takes precedence over `.agents/` example phrasing.
- **Brief flash of English before client `useEffect`:** On initial load, SSR renders `"en"` for one frame before switching to `es`/`ca` → **Mitigation:** Acceptable for a local workstation tool; keeps SSR deterministic without cookie-sync middleware.
