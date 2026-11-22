# Spec Delta

## ADDED Requirements

### Requirement: UI-only stage navigation guidance
The system SHALL instruct the agent never to suggest OpenSpec slash commands or CLI commands to the user, and instead to direct the user exclusively to the localized Workbench UI stage buttons for the active locale.

#### Scenario: Explore stage finishes and guides user to Propose
- **WHEN** the agent completes an `Explore` discussion while the active locale is `es`
- **THEN** the system prompt instructs the agent to direct the user to the `Proponer` button in the Workbench UI and forbids mentioning `/opsx-propose` or other OpenSpec commands
