# Spec Delta

## ADDED Requirements

### Requirement: Honest diagram references and override of ASCII rules
The system SHALL instruct the agent that web visual-diagram rules override any ASCII-diagram instructions in `.agents/` files and that it MUST NOT claim a diagram was prepared or shown unless it invoked `render_diagram` or emitted a Mermaid fenced block in the same turn.

#### Scenario: Agent explains a flow during explore stage
- **WHEN** the agent explains a workflow or data flow in `explore` stage
- **THEN** the system prompt instructs it to use `render_diagram` or a Mermaid fenced block instead of ASCII art and never to reference an unemitted diagram

### Requirement: Conversation history preserves rendered diagram context
The system SHALL include a brief summary of rendered diagrams in subsequent conversation history so multi-turn follow-ups know which diagrams were already shown.

#### Scenario: Multi-turn follow-up after a turn with a diagram
- **WHEN** an assistant turn includes one or more rendered diagrams and the user sends a follow-up message
- **THEN** the conversation history sent to the next turn includes the diagram titles or summaries alongside the assistant prose
