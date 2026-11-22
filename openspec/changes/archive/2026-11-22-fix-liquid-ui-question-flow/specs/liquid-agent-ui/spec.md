# Spec Delta

## MODIFIED Requirements

### Requirement: Liquid multi-question form cards
The system SHALL render structured question groups emitted by the agent as interactive form cards where each question has its own dedicated input control and a single group submission action.

#### Scenario: Agent asks multiple questions in one turn
- **WHEN** the agent emits a `questions` block containing 2 or more questions (with types such as free text, single choice, multi-choice, or confirmation)
- **THEN** the UI renders each question with its corresponding input control and disables further agent turns until the user submits the answers

#### Scenario: Submitting a Question Group Card
- **WHEN** the user fills in the question fields and clicks submit
- **THEN** the system sends the structured question-and-answer pairs back to the agent and locks the submitted card as a read-only summary

#### Scenario: Agent turn stops cleanly after emitting a question card
- **WHEN** the agent invokes `ask_questions` during a turn
- **THEN** the stream completes the turn without running an additional LLM step that appends trailing prose onto the preceding message

## ADDED Requirements

### Requirement: Informative proposals separated from interactive questions
The system SHALL instruct the agent to present informative proposals (such as proposed domain fields, states, rules, or data models) in Markdown prose or visual diagrams before invoking `ask_questions` for confirmation or targeted adjustments.

#### Scenario: Proposing domain fields and behaviors for confirmation
- **WHEN** the agent proposes standard fields, states, or business rules for one or more domains
- **THEN** the agent renders those proposed details visibly in Markdown or a diagram block and uses `ask_questions` only for the confirmation or adjustment input controls

### Requirement: Conversation history preserves question card context
The system SHALL include a summary of emitted question groups in subsequent conversation history even when the assistant turn also contains prose text.

#### Scenario: Multi-turn follow-up after text and question card
- **WHEN** an assistant turn contains both prose text and a `questionGroup` and the user sends a follow-up message
- **THEN** the conversation history sent to the next turn includes both the assistant prose and a summary of the question card prompts
