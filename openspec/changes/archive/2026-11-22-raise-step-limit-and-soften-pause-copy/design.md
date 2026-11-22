# Design

## Context

See `proposal.md` for motivation. `streamText` in `ai` defaults `maxSteps` to `1`, so `turn-runner.ts` must supply a positive integer as a loop-safety cap. The current `25` cap for `apply` is frequently reached during full-app builds, and `stepLimitReached` in `i18n` mentions *"steps"* / *"pasos"* / *"turno"*.

## Goals / Non-Goals

**Goals:**
- Increase `maxSteps` in `turn-runner.ts` (`100` for `apply`, `40` for `propose`, `20` for other stages).
- Update `stepLimitReached` in `en.ts`, `es.ts`, and `ca.ts` to use warm, non-technical pause wording.

**Non-Goals:**
- Removing `maxSteps` completely (since `ai` SDK defaults `maxSteps` to `1` when omitted).

## Decisions

1. **Stage-scaled safety caps:**
   - **Chosen approach**: `100` for `apply`, `40` for `propose`, `20` for `brief`/`explore`/`archive`.
   - **Why**: High enough that normal full-stack `apply` runs finish in one turn while still bounding runaway loops.

2. **Jargon-free pause copy:**
   - **Chosen approach**: Update `stepLimitReached` in `en`, `es`, `ca` to avoid "steps" / "turns" (e.g. `es`: `"He avanzado con una buena parte del trabajo y hago una pausa para no saturar la sesión. Escribe \"continúa\" para que siga con lo que falta."`).

## Risks / Trade-offs

- [None significant] → Purely configuration and copy adjustments.
