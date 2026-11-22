# Spec Delta

## ADDED Requirements

### Requirement: Rich and card-contained Markdown rendering
The system SHALL render assistant prose, document summaries, and unwrapped `markdown`/`md` fenced blocks with structured typography (headings, bold, italic, lists, tables, blockquotes) contained within the message card bounds without horizontal overflow.

#### Scenario: Agent emits a fenced markdown document block
- **WHEN** the agent emits a fenced ```` ```markdown ```` or ```` ```md ```` block (such as an `app-brief.md` summary)
- **THEN** the UI unwraps it and renders formatted Markdown headings, lists, emphasis, and tables aligned inside the message card instead of raw monospace code

#### Scenario: Wide tables or code blocks inside a message card
- **WHEN** an assistant message contains a Markdown table or a non-markdown `<pre>` code block with long lines
- **THEN** the card constrains the element width to the message container with internal scrolling or line wrapping so content never overflows past the card border
