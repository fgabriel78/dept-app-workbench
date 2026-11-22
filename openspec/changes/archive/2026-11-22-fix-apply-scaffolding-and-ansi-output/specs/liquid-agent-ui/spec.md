# Spec Delta

## ADDED Requirements

### Requirement: Non-empty workspace scaffolding guidance
The system SHALL inform the agent during `Propose` and `Apply` stages that the workspace root already contains template/OpenSpec files and instruct it to initialize `package.json`, dependencies, and project files directly rather than running empty-directory CLI scaffolders on `.`.

#### Scenario: Propose or Apply scaffolds a new web application
- **WHEN** the agent plans or implements application scaffolding in a workspace created from `dept-app-brief`
- **THEN** the system prompt instructs it not to run `create-next-app .` or `create-vite .` on the non-empty root and instead to initialize `package.json` (`npm init -y` + `npm install`) and write configuration and source files directly
