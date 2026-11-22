# Spec Delta

## MODIFIED Requirements

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
