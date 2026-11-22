# Tasks

## 1. Localized Thinking Status & UI Indicator

- [x] 1.1 Add `thinking` string to `src/lib/i18n/types.ts`, `en.ts`, `es.ts`, and `ca.ts` (verify `src/lib/i18n/__tests__/i18n.test.ts` passes).
- [x] 1.2 Render the animated thinking indicator in `src/components/workbench/WorkbenchApp.tsx` on the active streaming assistant turn when no text, diagram, question card, error, or running tool activity is visible, and verify with `npx tsc --noEmit` and `npm test`.
