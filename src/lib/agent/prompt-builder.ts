import fs from "fs";
import path from "path";
import type { StageId, WorkspaceState } from "@/lib/types";
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
    "Create a complete OpenSpec change (`proposal.md`, `design.md`, `specs/**/spec.md`, `tasks.md`) under `openspec/changes/` grounded in `app-brief.md` and exploration decisions.",
  apply:
    "Implement pending tasks from the active OpenSpec change's `tasks.md`, keeping edits minimal and verified with typechecks/builds, and check off completed tasks as you go.",
  archive:
    "Verify that tasks are complete and run `openspec archive` to finalize and archive the completed change cleanly.",
};

export const WEB_ADAPTER_CONTRACT = `
## Web UI Adapter Contract (Mandatory)
You are running inside the Dept App Workbench browser interface for non-technical business stakeholders and functional analysts. Follow these UI rules strictly:

1. **Structured Question Cards (\`ask_questions\`)**:
   - Whenever you need to ask the user 1 or more questions, ALWAYS invoke the \`ask_questions\` tool instead of listing raw bulleted questions in plain text.
   - Choose the best input \`type\` for each question:
     - \`"text"\` for open-ended answers
     - \`"single_choice"\` when the user should pick one option (provide \`options\`)
     - \`"multi_choice"\` when multiple options apply (provide \`options\`)
     - \`"confirm"\` for yes/no confirmations
   - After calling \`ask_questions\`, finish your turn briefly and wait for the user's submitted answers.

2. **Visual Diagrams (\`render_diagram\` / \`mermaid\`)**:
   - Never draw ASCII-art diagrams or text boxes.
   - Whenever explaining user flows, data models, architecture, or state transitions, invoke \`render_diagram\` with valid Mermaid syntax (e.g. \`flowchart TD\`, \`sequenceDiagram\`, \`erDiagram\`, \`stateDiagram-v2\`) or emit a \`\`\`mermaid fenced block.

3. **Non-Technical Clarity**:
   - Keep prose concise, warm, and jargon-free unless the user asks for technical details.
   - Explain what you discovered when reading workspace files in plain business language.
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

export function buildWebAdapterPrompt(projectRoot: string, stage: StageId): BuiltStagePrompt {
  const workspaceState = inspectWorkspaceState(projectRoot);
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
    [
      "## Workspace Snapshot",
      `- Project: ${workspaceState.projectName}`,
      `- Phase: ${workspaceState.phase}`,
      `- app-brief.md present: ${workspaceState.hasAppBrief ? "yes" : "no"}`,
      `- Active OpenSpec changes:\n${activeChangesSummary}`,
    ].join("\n"),
    WEB_ADAPTER_CONTRACT,
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
