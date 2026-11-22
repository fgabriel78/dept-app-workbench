# Spec Delta

## ADDED Requirements

### Requirement: Locale-aware agent responses and artifacts
The system SHALL pass the active workbench locale (`en`, `es`, or `ca`) to agent turns so the assistant responds, constructs Question Group Cards, labels visual diagrams, and authors functional/OpenSpec artifacts in the active language.

#### Scenario: Starting a stage session in Catalan or Spanish
- **WHEN** the user starts a stage session or sends a message while the active locale is `ca` or `es`
- **THEN** the agent turn uses a localized starter prompt (when triggered from the stage starter) and instructs the model to write conversational prose, question card prompts/options, diagram labels, and generated artifacts in Catalan or Spanish respectively
