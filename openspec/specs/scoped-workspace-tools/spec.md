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
