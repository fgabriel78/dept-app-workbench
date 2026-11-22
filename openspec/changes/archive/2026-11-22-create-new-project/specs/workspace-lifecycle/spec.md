# Spec Delta

## ADDED Requirements

### Requirement: Create a new project workspace from template
The system SHALL offer a "Create New Project" option alongside selecting an existing project folder, accepting a project name, sanitizing it into a valid hyphenated folder name under the configured projects root directory, cloning the configured template repository (`TEMPLATE_REPO_URL`), initializing a fresh Git repository (`git init`), and loading the resulting workspace.

#### Scenario: Creating a new project with a valid name
- **WHEN** the user chooses "Create New Project", enters a project name (such as `"Leave Request Tracker"`), and submits
- **THEN** the system sanitizes the name into a valid folder slug (`leave-request-tracker`), clones `TEMPLATE_REPO_URL` into that folder, re-initializes Git with `git init`, and loads the new workspace in the `Brief` stage

#### Scenario: Project name sanitizes to an empty slug or collides with an existing folder
- **WHEN** the user enters a name with no valid alphanumeric characters or a name whose sanitized folder already exists under the configured projects root directory
- **THEN** the system rejects the creation with a clear, localized error message without modifying existing directories

#### Scenario: Template repository clone fails
- **WHEN** cloning `TEMPLATE_REPO_URL` fails (e.g., unreachable URL or missing `git` CLI)
- **THEN** the system cleans up any partial target directory and returns a clear, localized error message
