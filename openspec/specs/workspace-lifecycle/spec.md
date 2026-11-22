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

### Requirement: Create a new project workspace from template
The system SHALL offer a "Create New Project" option alongside selecting an existing project folder, accepting a project name, sanitizing it into a valid hyphenated folder name under the configured projects root directory, cloning the configured template repository (`TEMPLATE_REPO_URL`), initializing a fresh Git repository (`git init`), and loading the resulting workspace.

#### Scenario: Creating a new project with a valid name
- **WHEN** the user chooses "Create New Project", enters a project name (such as `"Leave Request Tracker"`), and submits
- **THEN** the system sanitizes the name into a valid folder slug (`leave-request-tracker`), clones `TEMPLATE_REPO_URL` into that folder, re-initializes Git with `git init`, and loads the new workspace in the `Brief` stage

#### Scenario: Project name sanitizes to an empty slug or collides with an existing folder
- **WHEN** the user enters a name with no valid alphanumeric characters or a name whose sanitized folder already exists under the configured projects root directory
- **THEN** the system rejects the creation with a clear, localized error message without modifying existing directories

#### Scenario: Template repository clone fails
- **WHEN** cloning `TEMPLATE_REPO_URL` fails (e.g., unreachable URL or missing `git` CLI)
- **THEN** the system cleans up any partial target directory and returns a clear, localized error message

### Requirement: Six-stage lifecycle detection and navigation
The system SHALL detect the current project state and display a 6-stage stepper covering `Brief`, `Explore`, `Propose`, `Apply`, `Test`, and `Archive`.

#### Scenario: Stage readiness detection
- **WHEN** a project directory is loaded
- **THEN** the system inspects `app-brief.md` and `openspec/changes/` to indicate which stages are completed, active, or available next, recommending `Test` once all tasks in `Apply` are completed while keeping `Archive` available

#### Scenario: Advancing to the next stage
- **WHEN** the user selects an available stage (such as moving from `Apply` to `Test` after tasks are complete, or from `Test` to `Archive`)
- **THEN** the system switches the active workflow/skill context and preserves the project workspace state

### Requirement: Live artifact preview panel
The system SHALL display a formatted, human-readable preview of key workspace artifacts (`app-brief.md`, `proposal.md`, `design.md`, `specs/`, and `tasks.md`) alongside the conversation.

#### Scenario: Artifact created or updated during a turn
- **WHEN** the agent creates or modifies `app-brief.md` or an OpenSpec change artifact
- **THEN** the preview panel refreshes automatically to show the updated content and task completion progress
