# Spec Delta

## MODIFIED Requirements

### Requirement: Multi-step stage completion and step-limit notice
The system SHALL allow multi-step planning and implementation stages to complete their required tool sequences and SHALL notify the user in plain, jargon-free language if a turn pauses at its safety limit without a closing summary.

#### Scenario: Propose stage completes all artifacts and summarizes next steps
- **WHEN** the agent runs a `Propose` turn that creates `proposal.md`, capability specs, `design.md`, and `tasks.md`
- **THEN** the turn completes all artifact writes and emits a plain-language closing summary explaining that the plan is ready for the `Apply` stage

#### Scenario: Turn reaches step limit without a final summary
- **WHEN** an agent turn exhausts its safety limit while executing tools without emitting a closing message
- **THEN** the system emits a localized, jargon-free pause message (without mentioning technical terms like "steps" or "turns") inviting the user to ask the assistant to continue
