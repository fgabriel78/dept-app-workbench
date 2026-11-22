# Spec Delta

## Purpose

Manages launching, monitoring, and stopping the implemented workspace application on a free local port with an embedded SQLite database profile and an interactive live preview panel during the Test stage.

## ADDED Requirements

### Requirement: Managed local preview process lifecycle
The system SHALL provide a workspace preview API that starts the implemented project's dev/start server on an available local port, reports running status, URL, and recent sanitized logs, and stops the process cleanly on demand.

#### Scenario: Starting and stopping a workspace preview server
- **WHEN** the user starts the preview for a valid workspace containing a runnable `package.json` script
- **THEN** the system allocates a free local port, spawns the server process scoped to the workspace directory, waits until it listens (or reports startup errors/logs), and stops the child process cleanly when requested

### Requirement: Embedded SQLite runtime profile for local preview
The system SHALL instruct `Propose`, `Apply`, and `Test` stages so any application requiring a database includes an embedded SQLite local runtime profile (with schema initialization and sample seed data) and SHALL launch preview processes with embedded SQLite environment defaults (`DATABASE_URL` and `DB_CLIENT=sqlite`) even when the production target database is not SQLite.

#### Scenario: Application targeting PostgreSQL or MySQL runs in Test stage
- **WHEN** the implemented application targets a non-SQLite production database and is launched in the `Test` stage
- **THEN** the preview runtime provides embedded SQLite environment defaults (`DATABASE_URL=file:./dev.db`, `DB_CLIENT=sqlite`) so screens operate locally without requiring an external database server

### Requirement: Live interactive preview panel in Test stage
The system SHALL display a localized live preview panel in the `Test` stage with Start, Restart, and Stop controls, a clickable `localhost` link, an embedded iframe preview, and expandable server logs.

#### Scenario: Previewing the running app inside the Test stage
- **WHEN** the user is on the `Test` stage and the preview server is running
- **THEN** the UI renders the live application inside an iframe alongside an "Open in new tab" link, Stop/Restart controls, and a collapsible log viewer
