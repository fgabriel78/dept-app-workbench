import { tool, type Tool } from "ai";
import { z } from "zod";
import type { DiagramPayload, QuestionGroupPayload, StageId, ToolActivityEvent } from "@/lib/types";
import { WorkspaceToolbox } from "./workspace-toolbox";

export type StageToolName =
  | "read_file"
  | "list_dir"
  | "write_file"
  | "edit_file"
  | "run_command"
  | "ask_questions"
  | "render_diagram";

export const STAGE_ALLOWED_TOOLS: Record<StageId, readonly StageToolName[]> = {
  brief: ["read_file", "list_dir", "write_file", "ask_questions", "render_diagram"],
  explore: ["read_file", "list_dir", "run_command", "ask_questions", "render_diagram"],
  propose: ["read_file", "list_dir", "write_file", "run_command", "ask_questions", "render_diagram"],
  apply: ["read_file", "list_dir", "write_file", "edit_file", "run_command", "ask_questions", "render_diagram"],
  archive: ["read_file", "list_dir", "run_command", "ask_questions"],
};

const SHELL_CHAIN_PATTERN = /[;&|><`$\n\r]/;

export function getStageCommandFilter(
  stage: StageId,
): (command: string) => { allowed: boolean; reason?: string } {
  if (stage === "apply") {
    return () => ({ allowed: true });
  }

  if (stage === "brief") {
    return () => ({
      allowed: false,
      reason: "Command execution is disabled during the Brief stage.",
    });
  }

  return (command: string) => {
    const trimmed = command.trim();
    if (SHELL_CHAIN_PATTERN.test(trimmed)) {
      return {
        allowed: false,
        reason: `Shell chaining/redirection operators are not permitted during the ${stage} stage.`,
      };
    }

    if (stage === "explore") {
      const allowedReadOnly = /^openspec\s+(list|status|show|view|validate|instructions)\b/i;
      if (!allowedReadOnly.test(trimmed)) {
        return {
          allowed: false,
          reason:
            "Explore stage is read-only: only read-only `openspec` commands (list, status, show, view, validate, instructions) are allowed.",
        };
      }
      return { allowed: true };
    }

    if (stage === "propose") {
      const allowedPropose = /^openspec\s+(new\s+change|list|status|show|view|validate|instructions)\b/i;
      if (!allowedPropose.test(trimmed)) {
        return {
          allowed: false,
          reason:
            "Propose stage only permits `openspec` planning commands (new change, status, instructions, list, show, validate).",
        };
      }
      return { allowed: true };
    }

    if (stage === "archive") {
      const allowedArchive = /^openspec\s+(archive|list|status|show|view|validate)\b/i;
      if (!allowedArchive.test(trimmed)) {
        return {
          allowed: false,
          reason: "Archive stage only permits `openspec archive` and read-only `openspec` commands.",
        };
      }
      return { allowed: true };
    }

    return { allowed: false, reason: "Command not permitted." };
  };
}

export function getStageWritePathFilter(
  stage: StageId,
): ((relativePath: string) => { allowed: boolean; reason?: string }) | undefined {
  if (stage === "brief") {
    return (relativePath: string) => {
      const normalized = relativePath.replace(/\\/g, "/").toLowerCase();
      if (normalized === "app-brief.md") {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `During the Brief stage, file writes are scoped to "app-brief.md" (attempted: "${relativePath}").`,
      };
    };
  }

  if (stage === "propose") {
    return (relativePath: string) => {
      const normalized = relativePath.replace(/\\/g, "/").toLowerCase();
      if (normalized.startsWith("openspec/")) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `During the Propose stage, file writes are scoped to "openspec/" artifacts (attempted: "${relativePath}").`,
      };
    };
  }

  return undefined;
}

export type BuildStageToolsOptions = {
  projectRoot: string;
  stage: StageId;
  onActivity?: (activity: ToolActivityEvent) => void;
  onQuestionGroup?: (payload: QuestionGroupPayload) => void;
  onDiagram?: (payload: DiagramPayload) => void;
  onArtifactWritten?: (relativePath: string) => void;
};

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export function buildStageTools(options: BuildStageToolsOptions): Record<string, Tool> {
  const { projectRoot, stage, onActivity, onQuestionGroup, onDiagram, onArtifactWritten } = options;
  const allowed = new Set<StageToolName>(STAGE_ALLOWED_TOOLS[stage]);

  const toolbox = new WorkspaceToolbox({
    projectRoot,
    commandFilter: getStageCommandFilter(stage),
    writePathFilter: getStageWritePathFilter(stage),
    onArtifactWritten,
  });

  const tools: Record<string, Tool> = {};

  if (allowed.has("read_file")) {
    tools.read_file = tool({
      description: "Read the UTF-8 contents of a file inside the selected project workspace.",
      parameters: z.object({
        path: z.string().describe("Relative path inside the project workspace."),
      }),
      execute: async ({ path: filePath }) => {
        const id = nextId("act");
        onActivity?.({
          id,
          toolName: "read_file",
          label: `Reading ${filePath}`,
          status: "running",
        });
        try {
          const result = toolbox.readFile(filePath);
          onActivity?.({
            id,
            toolName: "read_file",
            label: `Read ${result.path}`,
            status: "done",
          });
          return result;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          onActivity?.({
            id,
            toolName: "read_file",
            label: `Failed to read ${filePath}`,
            status: "error",
            detail: message,
          });
          return { error: message };
        }
      },
    });
  }

  if (allowed.has("list_dir")) {
    tools.list_dir = tool({
      description: "List files and subdirectories inside a folder of the selected project workspace.",
      parameters: z.object({
        path: z.string().optional().default(".").describe("Relative directory path (defaults to workspace root)."),
      }),
      execute: async ({ path: dirPath }) => {
        const id = nextId("act");
        const labelTarget = dirPath && dirPath !== "." ? dirPath : "workspace root";
        onActivity?.({
          id,
          toolName: "list_dir",
          label: `Inspecting ${labelTarget}`,
          status: "running",
        });
        try {
          const result = toolbox.listDir(dirPath ?? ".");
          onActivity?.({
            id,
            toolName: "list_dir",
            label: `Listed ${labelTarget} (${result.entries.length} items)`,
            status: "done",
          });
          return result;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          onActivity?.({
            id,
            toolName: "list_dir",
            label: `Failed to list ${labelTarget}`,
            status: "error",
            detail: message,
          });
          return { error: message };
        }
      },
    });
  }

  if (allowed.has("write_file")) {
    tools.write_file = tool({
      description: "Create or overwrite a file inside the selected project workspace.",
      parameters: z.object({
        path: z.string().describe("Relative file path to write."),
        content: z.string().describe("Full file contents."),
      }),
      execute: async ({ path: filePath, content }) => {
        const id = nextId("act");
        onActivity?.({
          id,
          toolName: "write_file",
          label: `Writing ${filePath}`,
          status: "running",
        });
        try {
          const result = toolbox.writeFile(filePath, content);
          onActivity?.({
            id,
            toolName: "write_file",
            label: `Updated ${result.path}`,
            status: "done",
          });
          return result;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          onActivity?.({
            id,
            toolName: "write_file",
            label: `Could not write ${filePath}`,
            status: "error",
            detail: message,
          });
          return { error: message };
        }
      },
    });
  }

  if (allowed.has("edit_file")) {
    tools.edit_file = tool({
      description: "Replace an exact text block in an existing file inside the project workspace.",
      parameters: z.object({
        path: z.string().describe("Relative file path to edit."),
        target: z.string().describe("Exact existing text to replace."),
        replacement: z.string().describe("Replacement text."),
      }),
      execute: async ({ path: filePath, target, replacement }) => {
        const id = nextId("act");
        onActivity?.({
          id,
          toolName: "edit_file",
          label: `Editing ${filePath}`,
          status: "running",
        });
        try {
          const result = toolbox.editFile(filePath, target, replacement);
          onActivity?.({
            id,
            toolName: "edit_file",
            label: `Edited ${result.path}`,
            status: "done",
          });
          return result;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          onActivity?.({
            id,
            toolName: "edit_file",
            label: `Could not edit ${filePath}`,
            status: "error",
            detail: message,
          });
          return { error: message };
        }
      },
    });
  }

  if (allowed.has("run_command")) {
    tools.run_command = tool({
      description: "Run an allowed CLI command (such as openspec, npm, or npx tsc) in the project workspace.",
      parameters: z.object({
        command: z.string().describe("Command string to execute in project root."),
      }),
      execute: async ({ command }) => {
        const id = nextId("act");
        onActivity?.({
          id,
          toolName: "run_command",
          label: `Running ${command.split(" ").slice(0, 2).join(" ")}`,
          status: "running",
          detail: command,
        });
        try {
          const result = await toolbox.runCommand(command);
          onActivity?.({
            id,
            toolName: "run_command",
            label:
              result.exitCode === 0
                ? `Completed ${command.split(" ").slice(0, 2).join(" ")}`
                : `Command exited with code ${result.exitCode}`,
            status: result.exitCode === 0 ? "done" : "error",
            detail: [result.stdout, result.stderr].filter(Boolean).join("\n").slice(0, 2000),
          });
          return result;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          onActivity?.({
            id,
            toolName: "run_command",
            label: "Command blocked",
            status: "error",
            detail: message,
          });
          return { error: message };
        }
      },
    });
  }

  if (allowed.has("ask_questions")) {
    tools.ask_questions = tool({
      description:
        "Present one or more structured questions to the user as an interactive Question Group Card and pause for their response.",
      parameters: z.object({
        title: z.string().optional().describe("Short heading for the question card."),
        description: z.string().optional().describe("Optional brief context sentence."),
        questions: z
          .array(
            z.object({
              id: z.string().describe("Unique identifier for this question."),
              prompt: z.string().describe("The question text shown to the user."),
              type: z.enum(["text", "single_choice", "multi_choice", "confirm"]),
              options: z.array(z.string()).optional().describe("Choices for single_choice or multi_choice."),
              placeholder: z.string().optional().describe("Placeholder hint for text inputs."),
              required: z.boolean().optional().default(true),
            }),
          )
          .min(1),
      }),
      execute: async (input) => {
        const payload: QuestionGroupPayload = {
          id: nextId("qgroup"),
          title: input.title,
          description: input.description,
          questions: input.questions,
        };
        onQuestionGroup?.(payload);
        return {
          status: "awaiting_user_response",
          questionCount: input.questions.length,
        };
      },
    });
  }

  if (allowed.has("render_diagram")) {
    tools.render_diagram = tool({
      description: "Render a visual Mermaid diagram card in the user interface instead of ASCII art.",
      parameters: z.object({
        title: z.string().optional().describe("Short descriptive title for the diagram."),
        mermaid: z.string().describe("Valid Mermaid diagram definition (e.g. flowchart TD, sequenceDiagram, erDiagram)."),
      }),
      execute: async (input) => {
        const payload: DiagramPayload = {
          id: nextId("diag"),
          title: input.title,
          mermaid: input.mermaid,
        };
        onDiagram?.(payload);
        return { status: "rendered", title: input.title ?? "Diagram" };
      },
    });
  }

  return tools;
}
