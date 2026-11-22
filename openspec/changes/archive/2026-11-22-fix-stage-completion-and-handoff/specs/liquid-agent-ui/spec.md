# Spec Delta

## ADDED Requirements

### Requirement: Multi-step stage completion and step-limit notice
The system SHALL allow multi-step planning and implementation stages to complete their required tool sequences and SHALL notify the user in plain language if a turn stops at its step limit without a closing summary.

#### Scenario: Propose stage completes all artifacts and summarizes next steps
- **WHEN** the agent runs a `Propose` turn that creates `proposal.md`, capability specs, `design.md`, and `tasks.md`
- **THEN** the turn completes all artifact writes and emits a plain-language closing summary explaining that the plan is ready for the `Apply` stage

#### Scenario: Turn reaches step limit without a final summary
- **WHEN** an agent turn exhausts its maximum step budget while executing tools without emitting a closing message
- **THEN** the system emits a localized notice informing the user that the step limit was reached and they can ask the assistant to continue

### Requirement: Next-stage handoff call-to-action
The system SHALL display a localized next-stage handoff banner with a direct navigation button whenever streaming is idle and the workspace's recommended stage differs from the currently active stage.

#### Scenario: Propose completes and recommends Apply
- **WHEN** the user is on the `Propose` stage, streaming finishes, and the workspace's recommended stage updates to `Apply`
- **THEN** the UI displays a localized handoff banner with a button that switches directly to the `Apply` stage