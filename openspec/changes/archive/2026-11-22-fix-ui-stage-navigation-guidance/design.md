# Design

## Context

See `proposal.md` for motivation. `buildWebAdapterPrompt` in `src/lib/agent/prompt-builder.ts` already receives `locale: Locale` and loads `.agents/` skill/workflow files into the `systemPrompt`. Those `.agents/` files reference `/opsx-*`, `/openspec-*`, and `openspec` CLI commands.

## Goals / Non-Goals

**Goals:**
- Add a mandatory UI-only navigation rule in `prompt-builder.ts` that overrides `.agents/` slash/CLI handoff text.
- Dynamically include the exact localized stage button labels from `getDictionary(locale).stages` (`Brief`, `Explore`/`Explorar`, `Propose`/`Proponer`/`Proposar`, `Apply`/`Aplicar`, `Archive`/`Archivar`/`Arxivar`).

**Non-Goals:**
- Editing `.agents/skills/` files inside cloned user workspaces.
- Stripping slash-command strings post-hoc from streamed LLM text.

## Decisions

1. **Dynamic localized stage labels in `buildWebAdapterContract(locale)` (or `buildWebAdapterPrompt`):**
   - **Chosen approach**: Add a rule in `WEB_ADAPTER_CONTRACT` (plus a localized `UI Stage Navigation` block in `buildWebAdapterPrompt` using `getDictionary(locale).stages`) that explicitly forbids suggesting `/opsx-*`, `/openspec-*`, or `openspec` CLI commands and tells the assistant to reference the exact localized stage button labels.
   - **Why**: Keeping `WEB_ADAPTER_CONTRACT` exported as a constant preserves backwards compatibility if anything imports it, while `buildWebAdapterPrompt` injects the locale-specific button labels.

## Risks / Trade-offs

- [`.agents/skills/` files are appended after `WEB_ADAPTER_CONTRACT` in `systemPrompt`] → State explicitly in `WEB_ADAPTER_CONTRACT` that it overrides `.agents/` handoff/command instructions, and reinforce the exact localized button labels in the prompt.
