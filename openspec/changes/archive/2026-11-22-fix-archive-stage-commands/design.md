# Design

## Context

See `proposal.md` for motivation. Currently:
1. `getStageCommandFilter("archive")` in `src/lib/tools/stage-tools.ts` allows `/^openspec\s+(archive|list|status|show|view|validate)\b/i`, blocking `openspec instructions` and `openspec context` which `.agents/skills/openspec-archive-change/SKILL.md` invokes.
2. `STAGE_OBJECTIVES.archive` in `src/lib/agent/prompt-builder.ts` does not tell the agent to use `openspec archive "<change-name>" --yes` instead of `mkdir`/`mv` or manual spec edits (which are disabled in `Archive`).

## Goals / Non-Goals

**Goals:**
- Permit `instructions` and `context` in `getStageCommandFilter("archive")`.
- Instruct the agent in `STAGE_OBJECTIVES.archive` to use `openspec archive "<change-name>" --yes` (which syncs specs and archives the change directory in one command) rather than `mkdir`, `mv`, or file-editing tools.

**Non-Goals:**
- Enabling `write_file`, `edit_file`, or arbitrary `mkdir`/`mv` shell commands during `Archive`.

## Decisions

1. **CLI-based archive (`openspec archive --yes`) over enabling `mkdir`/`mv`/`write_file`:**
   - **Chosen approach**: Keep `Archive` tightly scoped without `write_file`/`edit_file`/`mv`, and direct the agent to `openspec archive "<change-name>" --yes`.
   - **Why**: Preserves stage safety boundaries while still performing full spec-sync and archiving cleanly.

## Risks / Trade-offs

- [None significant] → `openspec archive --yes` is non-interactive and safe in `runCommand`.
