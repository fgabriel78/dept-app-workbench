# Tasks

## 1. UI-Only Stage Navigation Rule in Prompt Builder

- [x] 1.1 Update `WEB_ADAPTER_CONTRACT` and `buildWebAdapterPrompt` in `src/lib/agent/prompt-builder.ts` to forbid mentioning OpenSpec slash commands (`/opsx-*`, `/openspec-*`) or CLI commands (`openspec ...`) to the user, overriding `.agents/` instructions, and inject the exact localized stage button labels from `getDictionary(locale).stages`.
- [x] 1.2 Add unit tests in `src/lib/agent/__tests__/prompt-builder.test.ts` verifying the UI-only navigation rule and localized stage button labels for `en`, `es`, and `ca`; verify with `npx tsc --noEmit` and `npm test`.
