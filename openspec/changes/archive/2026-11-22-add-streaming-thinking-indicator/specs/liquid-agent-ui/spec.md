# Spec Delta

## ADDED Requirements

### Requirement: Immediate streaming thinking indicator
The system SHALL display a localized animated thinking indicator on the active assistant turn while waiting for the first text token or active tool activity, and between completed tool calls and subsequent output.

#### Scenario: Waiting for initial assistant response after starting a stage
- **WHEN** the user starts a stage session or sends a message and streaming begins before any text, diagram, question card, or running tool activity arrives
- **THEN** the active assistant turn displays an animated loading indicator with localized status text so the user knows the system is working
