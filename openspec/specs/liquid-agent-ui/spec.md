# liquid-agent-ui Specification

## Purpose
Provides a "liquid" conversational web interface backed by a direct LLM API that renders multi-question agent turns as interactive form cards and text diagrams as visual SVG diagrams.

## Requirements

### Requirement: Liquid multi-question form cards
The system SHALL render structured question groups emitted by the agent as interactive form cards where each question has its own dedicated input control and a single group submission action.

#### Scenario: Agent asks multiple questions in one turn
- **WHEN** the agent emits a `questions` block containing 2 or more questions (with types such as free text, single choice, multi-choice, or confirmation)
- **THEN** the UI renders each question with its corresponding input control and disables further agent turns until the user submits the answers

#### Scenario: Submitting a Question Group Card
- **WHEN** the user fills in the question fields and clicks submit
- **THEN** the system sends the structured question-and-answer pairs back to the agent and locks the submitted card as a read-only summary

### Requirement: Visual diagram rendering
The system SHALL render diagram blocks emitted by the agent as interactive visual diagrams instead of raw text.

#### Scenario: Agent emits a Mermaid diagram
- **WHEN** the agent emits a `diagram` block or Mermaid fenced block
- **THEN** the UI renders it as a styled SVG diagram with zoom controls and an optional toggle to inspect the raw source

#### Scenario: Invalid diagram syntax fallback
- **WHEN** a diagram block fails to render visually
- **THEN** the UI gracefully falls back to displaying the raw diagram source with a non-blocking warning

### Requirement: Streaming conversation with tool activity indicators
The system SHALL stream agent text and UI blocks incrementally to the browser and display concise, non-technical status indicators while the agent inspects or updates workspace files.

#### Scenario: Agent reads repository files before asking questions
- **WHEN** the agent executes workspace read tools (such as checking for `.sql` or `.csv` files)
- **THEN** the UI displays a compact activity indicator without exposing raw terminal logs unless expanded
