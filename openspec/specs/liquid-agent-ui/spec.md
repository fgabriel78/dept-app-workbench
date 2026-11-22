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

#### Scenario: Agent turn stops cleanly after emitting a question card
- **WHEN** the agent invokes `ask_questions` during a turn
- **THEN** the stream completes the turn without running an additional LLM step that appends trailing prose onto the preceding message

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

### Requirement: Locale-aware agent responses and artifacts
The system SHALL pass the active workbench locale (`en`, `es`, or `ca`) to agent turns so the assistant responds, constructs Question Group Cards, labels visual diagrams, and authors functional/OpenSpec artifacts in the active language.

#### Scenario: Starting a stage session in Catalan or Spanish
- **WHEN** the user starts a stage session or sends a message while the active locale is `ca` or `es`
- **THEN** the agent turn uses a localized starter prompt (when triggered from the stage starter) and instructs the model to write conversational prose, question card prompts/options, diagram labels, and generated artifacts in Catalan or Spanish respectively

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

### Requirement: Rich and card-contained Markdown rendering
The system SHALL render assistant prose, document summaries, and unwrapped `markdown`/`md` fenced blocks with structured typography (headings, bold, italic, lists, tables, blockquotes) contained within the message card bounds without horizontal overflow.

#### Scenario: Agent emits a fenced markdown document block
- **WHEN** the agent emits a fenced ```` ```markdown ```` or ```` ```md ```` block (such as an `app-brief.md` summary)
- **THEN** the UI unwraps it and renders formatted Markdown headings, lists, emphasis, and tables aligned inside the message card instead of raw monospace code

#### Scenario: Wide tables or code blocks inside a message card
- **WHEN** an assistant message contains a Markdown table or a non-markdown `<pre>` code block with long lines
- **THEN** the card constrains the element width to the message container with internal scrolling or line wrapping so content never overflows past the card border

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

### Requirement: Multi-step stage completion and step-limit notice
The system SHALL allow multi-step planning and implementation stages to complete their required tool sequences and SHALL notify the user in plain, jargon-free language if a turn pauses at its safety limit without a closing summary.

#### Scenario: Propose stage completes all artifacts and summarizes next steps
- **WHEN** the agent runs a `Propose` turn that creates `proposal.md`, capability specs, `design.md`, and `tasks.md`
- **THEN** the turn completes all artifact writes and emits a plain-language closing summary explaining that the plan is ready for the `Apply` stage

#### Scenario: Turn reaches step limit without a final summary
- **WHEN** an agent turn exhausts its safety limit while executing tools without emitting a closing message
- **THEN** the system emits a localized, jargon-free pause message (without mentioning technical terms like "steps" or "turns") inviting the user to ask the assistant to continue

### Requirement: Next-stage handoff call-to-action
The system SHALL display a localized next-stage handoff banner with a direct navigation button whenever streaming is idle and the workspace's recommended stage differs from the currently active stage.

#### Scenario: Propose completes and recommends Apply
- **WHEN** the user is on the `Propose` stage, streaming finishes, and the workspace's recommended stage updates to `Apply`
- **THEN** the UI displays a localized handoff banner with a button that switches directly to the `Apply` stage

### Requirement: UI-only stage navigation guidance
The system SHALL instruct the agent never to suggest OpenSpec slash commands or CLI commands to the user, and instead to direct the user exclusively to the localized Workbench UI stage buttons for the active locale.

#### Scenario: Explore stage finishes and guides user to Propose
- **WHEN** the agent completes an `Explore` discussion while the active locale is `es`
- **THEN** the system prompt instructs the agent to direct the user to the `Proponer` button in the Workbench UI and forbids mentioning `/opsx-propose` or other OpenSpec commands

### Requirement: Immediate streaming thinking indicator
The system SHALL display a localized animated thinking indicator on the active assistant turn while waiting for the first text token or active tool activity, and between completed tool calls and subsequent output.

#### Scenario: Waiting for initial assistant response after starting a stage
- **WHEN** the user starts a stage session or sends a message and streaming begins before any text, diagram, question card, or running tool activity arrives
- **THEN** the active assistant turn displays an animated loading indicator with localized status text so the user knows the system is working

### Requirement: Non-empty workspace scaffolding guidance
The system SHALL inform the agent during `Propose` and `Apply` stages that the workspace root already contains template/OpenSpec files and instruct it to initialize `package.json`, dependencies, and project files directly rather than running empty-directory CLI scaffolders on `.`.

#### Scenario: Propose or Apply scaffolds a new web application
- **WHEN** the agent plans or implements application scaffolding in a workspace created from `dept-app-brief`
- **THEN** the system prompt instructs it not to run `create-next-app .` or `create-vite .` on the non-empty root and instead to initialize `package.json` (`npm init -y` + `npm install`) and write configuration and source files directly
