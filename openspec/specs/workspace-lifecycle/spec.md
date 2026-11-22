# workspace-lifecycle Specification

## Purpose
Allows users to select an isolated local project directory, track progress across the 5-stage brief-to-archive lifecycle, and view formatted previews of generated functional and OpenSpec artifacts.

## Requirements

### Requirement: Local project workspace selection and validation
The system SHALL allow the user to select or enter a local project directory path and validate that it is a valid project workspace before starting a session.

#### Scenario: Selecting a valid project directory
- **WHEN** the user provides an existing local directory path containing `.agents/` or `openspec/`
- **THEN** the system loads the project context and displays the active stage stepper

#### Scenario: Selecting a missing or non-project directory
- **WHEN** the user provides a non-existent path or a directory without `.agents/` or `openspec/`
- **THEN** the system rejects the selection with a clear, non-technical error message

### Requirement: Five-stage lifecycle detection and navigation
The system SHALL detect the current project state and display a 5-stage stepper covering `Brief`, `Explore`, `Propose`, `Apply`, and `Archive`.

#### Scenario: Stage readiness detection
- **WHEN** a project directory is loaded
- **THEN** the system inspects `app-brief.md` and `openspec/changes/` to indicate which stages are completed, active, or available next

#### Scenario: Advancing to the next stage
- **WHEN** the user selects an available stage (such as moving from `Brief` to `Explore` after `app-brief.md` exists)
- **THEN** the system switches the active workflow/skill context and preserves the project workspace state

### Requirement: Live artifact preview panel
The system SHALL display a formatted, human-readable preview of key workspace artifacts (`app-brief.md`, `proposal.md`, `design.md`, `specs/`, and `tasks.md`) alongside the conversation.

#### Scenario: Artifact created or updated during a turn
- **WHEN** the agent creates or modifies `app-brief.md` or an OpenSpec change artifact
- **THEN** the preview panel refreshes automatically to show the updated content and task completion progress
