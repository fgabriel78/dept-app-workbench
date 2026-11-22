# workbench-i18n Specification

## Purpose
Provides automatic system-locale detection, a persistent manual language switcher, and full localization across English, Spanish, and Catalan for all workbench UI copy, validation errors, and tool activity indicators.

## Requirements

### Requirement: Automatic system locale detection with English fallback
The system SHALL detect the user's preferred language from the system/browser locale settings (`ca*` for Catalan, `es*` for Spanish, and `en` fallback for any other locale) when no manual language preference is stored.

#### Scenario: System locale is Catalan or Spanish
- **WHEN** a user opens the workbench for the first time with a browser/system locale starting with `ca` or `es` (such as `ca-ES` or `es-ES`)
- **THEN** the workbench initializes in Catalan or Spanish respectively and updates the document `lang` attribute

#### Scenario: System locale is unsupported
- **WHEN** a user opens the workbench with a browser/system locale outside `en`, `es`, and `ca` (such as `fr-FR`)
- **THEN** the workbench falls back to English (`en`)

### Requirement: Persistent manual language switcher
The system SHALL provide a language selector in the workbench header allowing users to switch between English (`EN`), Spanish (`ES`), and Catalan (`CA`) at any time, and SHALL persist the selected preference across page reloads.

#### Scenario: Switching languages manually
- **WHEN** the user selects `CA` or `ES` in the header language switcher
- **THEN** all UI labels, stage stepper titles, empty states, form controls, and artifact inspector labels immediately update to the chosen language and the preference is persisted in browser storage

### Requirement: Localized validation and tool activity feedback
The system SHALL present workspace validation errors and tool-activity status labels in the active workbench language.

#### Scenario: Invalid workspace path in Spanish or Catalan
- **WHEN** the user submits a missing or non-project folder path while the active locale is `es` or `ca`
- **THEN** the server returns the validation error message in the active locale
