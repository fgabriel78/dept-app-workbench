import fs from "fs";
import path from "path";
import { getDictionary, LOCALE_NAMES, type Locale } from "@/lib/i18n";
import { STAGES, type StageId, type WorkspaceState } from "@/lib/types";
import { inspectWorkspaceState } from "@/lib/workspace/state";

const STAGE_AGENT_FILES: Record<StageId, string[]> = {
  brief: [
    ".agents/workflows/dept-app-brief.md",
    ".agents/rules/app-brief-openspec-bridge.md",
  ],
  explore: [
    ".agents/rules/app-brief-openspec-bridge.md",
    ".agents/skills/openspec-explore/SKILL.md",
  ],
  propose: [
    ".agents/rules/app-brief-openspec-bridge.md",
    ".agents/skills/openspec-propose/SKILL.md",
  ],
  apply: [
    ".agents/rules/app-brief-openspec-bridge.md",
    ".agents/skills/openspec-apply-change/SKILL.md",
  ],
  test: [
    ".agents/rules/app-brief-openspec-bridge.md",
  ],
  archive: [
    ".agents/rules/app-brief-openspec-bridge.md",
    ".agents/skills/openspec-archive-change/SKILL.md",
  ],
};

const STAGE_OBJECTIVES: Record<StageId, string> = {
  brief:
    "Guide the stakeholder through a friendly functional interview to create or refine `app-brief.md` in the workspace root. Inspect existing files first (such as CSVs, SQL schemas, or docs) before asking questions.",
  explore:
    "Act as a read-only thinking partner. Inspect `app-brief.md` and the codebase to clarify requirements, architecture, and trade-offs. Do NOT modify files or run mutating commands.",
  propose:
    "Create a complete OpenSpec change (`proposal.md`, `design.md`, `specs/**/spec.md`, `tasks.md`) under `openspec/changes/` grounded in `app-brief.md` and exploration decisions. Note that the workspace root is already non-empty (`.agents/`, `openspec/`, `app-brief.md`, `README.md`), so plan scaffolding via `npm init -y`, `npm install`, and direct file writes rather than empty-directory CLI generators like `create-next-app .`. If the application requires a database, include an embedded SQLite local-preview profile (`DATABASE_URL=file:./dev.db`, `DB_CLIENT=sqlite`) and a schema initialization/seed task so all screens work locally even if the production target database is PostgreSQL/MySQL. Once all artifacts are written, conclude with a clear, non-technical summary and tell the user they can now move to the Apply stage.",
  apply:
    "Implement pending tasks from the active OpenSpec change's `tasks.md`, keeping edits minimal and verified with typechecks/builds, and check off completed tasks as you go. Because the workspace root is non-empty (`.agents/`, `openspec/`, `app-brief.md`, `README.md`), NEVER run empty-directory CLI scaffolders (`create-next-app .`, `create-vite .`) on `.`; initialize `package.json` (`npm init -y` + `npm install`) and write config/source files directly instead. If the app uses a database, ensure it supports an embedded SQLite local profile (`DATABASE_URL=file:./dev.db`, `DB_CLIENT=sqlite`) with automatic table initialization and sample seed data so screens work locally. Conclude with a plain-language summary of what was implemented and that the user can now move to the Test stage.",
  test:
    "Prepare and verify the implemented application so the user can test its screens in the Workbench live preview panel before archiving. Inspect `package.json` and database configuration: if the app uses a database, ensure an embedded SQLite database (`dev.db`) is initialized and seeded with sample data (supporting `DATABASE_URL=file:./dev.db` and `DB_CLIENT=sqlite` even if production targets another DB). Fix any build or runtime issues, confirm the app builds/starts cleanly (do NOT leave a blocking `npm run dev` running inside `run_command` — the Workbench preview panel starts the server), and guide the user to start/open the live preview and move to the Archive stage once satisfied.",
  archive:
    "Verify that tasks are complete and run `openspec archive \"<change-name>\" --yes` to sync specs and archive the completed change in one command. Do NOT attempt `mkdir`, `mv`, or manual file edits (they are disabled in the Archive stage).",
};

export const WEB_ADAPTER_CONTRACT = `
## Web UI Adapter Contract (Mandatory)
You are running inside the Dept App Workbench browser interface for non-technical business stakeholders and functional analysts. Follow these UI rules strictly:

1. **Informative Proposals vs. Interactive Questions (\`ask_questions\`)**:
   - Whenever proposing data models, entity fields, states, business rules, or summaries, write the full proposal clearly in Markdown (lists or tables) or a visual diagram (\`render_diagram\`) in the message body FIRST so the user can always see it.
   - Whenever you need to ask the user 1 or more questions (including confirming or adjusting a proposal you just presented), ALWAYS invoke the \`ask_questions\` tool instead of listing raw bulleted questions in plain text.
   - Choose the best input \`type\` for each question:
     - \`"text"\` for open-ended answers
     - \`"single_choice"\` when the user should pick one option (provide \`options\`)
     - \`"multi_choice"\` when multiple options apply (provide \`options\`)
     - \`"confirm"\` for yes/no confirmations
   - Calling \`ask_questions\` pauses your turn so the user can respond; put any introductory context or proposal before calling it.

2. **Visual Diagrams (\`render_diagram\` / \`mermaid\`)**:
   - This rule overrides any ASCII-art or box-drawing instruction in \`.agents/\` skills or workflows: NEVER draw ASCII-art diagrams or text boxes.
   - Whenever explaining user flows, data models, architecture, or state transitions, invoke \`render_diagram\` with valid Mermaid syntax (e.g. \`flowchart TD\`, \`sequenceDiagram\`, \`erDiagram\`, \`stateDiagram-v2\`) or emit a \`\`\`mermaid fenced block.
   - NEVER claim in prose that you prepared, generated, or showed a visual diagram unless you actually invoked \`render_diagram\` or emitted a \`\`\`mermaid fenced block in this same turn.

3. **Non-Technical Clarity & Direct Markdown**:
   - Keep prose concise, warm, and jargon-free unless the user asks for technical details.
   - Explain what you discovered when reading workspace files in plain business language.
   - Never wrap document deliverables or summaries (such as \`app-brief.md\`) inside \`\`\`markdown fenced code blocks; emit them directly as formatted Markdown (headings, bold, italic, lists, and tables) so the UI renders them cleanly.

4. **UI-Only Stage Navigation (Mandatory)**:
   - This rule overrides any slash-command or CLI handoff instructions in \`.agents/\` skills or workflows.
   - NEVER tell or suggest to the user to run OpenSpec slash commands (such as \`/opsx-propose\`, \`/opsx-apply\`, \`/opsx-archive\`, \`/opsx-explore\`, \`/openspec-*\`) or CLI commands (\`openspec ...\`).
   - Always direct the user exclusively to the stage buttons in the Workbench header UI using the localized stage labels below.
`.trim();

function loadExistingAgentFiles(projectRoot: string, stage: StageId): Array<{ path: string; content: string }> {
  const loaded: Array<{ path: string; content: string }> = [];
  for (const relPath of STAGE_AGENT_FILES[stage]) {
    const absPath = path.join(projectRoot, relPath);
    if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
      loaded.push({
        path: relPath,
        content: fs.readFileSync(absPath, "utf8").trim(),
      });
    }
  }
  return loaded;
}

export type BuiltStagePrompt = {
  systemPrompt: string;
  loadedFiles: string[];
  workspaceState: WorkspaceState;
};

export function buildResponseLanguageDirective(locale: Locale): string {
  const languageName = LOCALE_NAMES[locale] ?? LOCALE_NAMES.en;
  return [
    "## Response Language (Mandatory)",
    `- The user's active workbench language is **${languageName}** (\`${locale}\`).`,
    `- Write ALL conversational replies, \`ask_questions\` titles, descriptions, prompts, options, and placeholders, and \`render_diagram\` titles and node/edge labels in **${languageName}**, even if project template files in \`.agents/\` are written in another language.`,
    `- When authoring \`app-brief.md\` or OpenSpec change artifacts (\`proposal.md\`, \`design.md\`, \`specs/\`, \`tasks.md\`), write all narrative prose in **${languageName}** while preserving required OpenSpec structural keywords (such as \`### Requirement:\`, \`#### Scenario:\`, \`- **WHEN**\`, \`- **THEN**\`, \`## ADDED Requirements\`).`,
  ].join("\n");
}

export function buildUiStageNavigationDirective(locale: Locale): string {
  const { stages } = getDictionary(locale);
  const labels = STAGES.map((id) => `**${stages[id].label}**`).join(" -> ");
  return [
    "## Workbench UI Stage Buttons (Use These Exact Labels)",
    `- Available stage buttons in the top bar: ${labels}`,
    "- When suggesting the next phase, refer only to clicking the corresponding stage button above (never mention `/opsx-*`, `/openspec-*`, or `openspec` commands).",
  ].join("\n");
}

export function buildWebAdapterPrompt(
  projectRoot: string,
  stage: StageId,
  locale: Locale = "en",
): BuiltStagePrompt {
  const workspaceState = inspectWorkspaceState(projectRoot, locale);
  const loadedDocs = loadExistingAgentFiles(projectRoot, stage);

  const activeChangesSummary =
    workspaceState.activeChanges.length > 0
      ? workspaceState.activeChanges
          .map(
            (c) =>
              `- ${c.name} (proposal: ${c.hasProposal ? "yes" : "no"}, design: ${c.hasDesign ? "yes" : "no"}, specs: ${c.specFiles.length}, tasks: ${c.taskProgress.completed}/${c.taskProgress.total})`,
          )
          .join("\n")
      : "- None yet";

  const sections: string[] = [
    `# Dept App Workbench — Active Stage: ${stage.toUpperCase()}`,
    `## Stage Objective\n${STAGE_OBJECTIVES[stage]}`,
    buildResponseLanguageDirective(locale),
    [
      "## Workspace Snapshot",
      `- Project: ${workspaceState.projectName}`,
      `- Phase: ${workspaceState.phase}`,
      `- app-brief.md present: ${workspaceState.hasAppBrief ? "yes" : "no"}`,
      `- Active OpenSpec changes:\n${activeChangesSummary}`,
    ].join("\n"),
    WEB_ADAPTER_CONTRACT,
    buildUiStageNavigationDirective(locale),
  ];

  if (loadedDocs.length > 0) {
    sections.push(
      [
        "## Project Workflow & Skill Instructions (from `.agents/`)",
        ...loadedDocs.map((doc) => `### ${doc.path}\n${doc.content}`),
      ].join("\n\n"),
    );
  }

  return {
    systemPrompt: sections.join("\n\n---\n\n"),
    loadedFiles: loadedDocs.map((d) => d.path),
    workspaceState,
  };
}
