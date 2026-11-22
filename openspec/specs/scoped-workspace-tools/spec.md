# scoped-workspace-tools Specification

## Purpose
Enforces directory-scoped, stage-gated file and command execution so the agent can safely inspect, plan, and implement changes strictly within the selected local project folder.

## Requirements

### Requirement: Directory path confinement
The system SHALL restrict all file reads, writes, edits, listings, and command executions to the selected project root directory.

#### Scenario: Path traversal attempt
- **WHEN** a tool invocation attempts to access a path outside the selected project root (e.g., via `..` or an absolute path outside the root)
- **THEN** the system rejects the tool call with an access-denied error

### Requirement: Stage-gated tool permissions
The system SHALL restrict available workspace tools based on the active lifecycle stage.

#### Scenario: Read-only enforcement during Explore
- **WHEN** the active stage is `Explore`
- **THEN** write, edit, and mutating command tools SHALL be disabled so the agent can only inspect files and read OpenSpec state

#### Scenario: Full workspace tools during Apply
- **WHEN** the active stage is `Apply`
- **THEN** the agent SHALL have access to file write/edit tools and project command execution (such as `openspec`, `tsc`, and build commands) within the project root

#### Scenario: Archive stage permits openspec archive and read-only inspection
- **WHEN** the active stage is `Archive`
- **THEN** the agent SHALL have access to `openspec archive` and read-only `openspec` inspection commands (including `list`, `status`, `show`, `view`, `validate`, `instructions`, and `context`) while file write/edit tools and arbitrary shell commands remain disabled

### Requirement: Clean command output without ANSI escape sequences
The system SHALL strip ANSI terminal color and formatting escape sequences from command `stdout` and `stderr` before returning results to the agent or displaying them in activity details.

#### Scenario: Command emits ANSI-colored output
- **WHEN** a workspace command writes ANSI escape codes (such as `\u001b[32m` or `\u001b[39m`) to `stdout` or `stderr`
- **THEN** the returned command result contains plain text with all ANSI escape sequences removed
