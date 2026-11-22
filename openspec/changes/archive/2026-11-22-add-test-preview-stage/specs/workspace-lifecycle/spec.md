# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Five-stage lifecycle detection and navigation`
- TO: `### Requirement: Six-stage lifecycle detection and navigation`

## MODIFIED Requirements

### Requirement: Six-stage lifecycle detection and navigation
The system SHALL detect the current project state and display a 6-stage stepper covering `Brief`, `Explore`, `Propose`, `Apply`, `Test`, and `Archive`.

#### Scenario: Stage readiness detection
- **WHEN** a project directory is loaded
- **THEN** the system inspects `app-brief.md` and `openspec/changes/` to indicate which stages are completed, active, or available next, recommending `Test` once all tasks in `Apply` are completed while keeping `Archive` available

#### Scenario: Advancing to the next stage
- **WHEN** the user selects an available stage (such as moving from `Apply` to `Test` after tasks are complete, or from `Test` to `Archive`)
- **THEN** the system switches the active workflow/skill context and preserves the project workspace state
