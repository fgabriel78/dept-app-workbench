export const STAGES = ["brief", "explore", "propose", "apply", "test", "archive"] as const;
export type StageId = (typeof STAGES)[number];

export type PreviewStatusState = "idle" | "starting" | "running" | "error";

export type PreviewStatus = {
  status: PreviewStatusState;
  projectRoot: string | null;
  port: number | null;
  url: string | null;
  logs: string[];
  error: string | null;
};

export type StageStatus = "completed" | "active" | "available" | "upcoming";

export type StageSummary = {
  id: StageId;
  label: string;
  description: string;
  status: StageStatus;
};

export type TaskProgress = {
  total: number;
  completed: number;
  remaining: number;
};

export type ActiveChangeInfo = {
  name: string;
  hasProposal: boolean;
  hasDesign: boolean;
  hasSpecs: boolean;
  hasTasks: boolean;
  specFiles: string[];
  taskProgress: TaskProgress;
};

export type WorkspacePhase =
  | "empty"
  | "brief-ready"
  | "proposed"
  | "in-progress"
  | "ready-to-archive";

export type WorkspaceState = {
  rootPath: string;
  projectName: string;
  hasAgentsDir: boolean;
  hasOpenspecDir: boolean;
  hasAppBrief: boolean;
  activeChanges: ActiveChangeInfo[];
  archivedChanges: string[];
  phase: WorkspacePhase;
  recommendedStage: StageId;
  stages: StageSummary[];
};

export type QuestionType = "text" | "single_choice" | "multi_choice" | "confirm";

export type QuestionItem = {
  id: string;
  prompt: string;
  type: QuestionType;
  options?: string[];
  placeholder?: string;
  required?: boolean;
};

export type QuestionGroupPayload = {
  id: string;
  title?: string;
  description?: string;
  questions: QuestionItem[];
};

export type DiagramPayload = {
  id: string;
  title?: string;
  mermaid: string;
};

export type ToolActivityEvent = {
  id: string;
  toolName: string;
  label: string;
  status: "running" | "done" | "error";
  detail?: string;
};

export type AgentSseEvent =
  | { type: "text_delta"; delta: string }
  | { type: "tool_activity"; activity: ToolActivityEvent }
  | { type: "question_group"; payload: QuestionGroupPayload }
  | { type: "diagram"; payload: DiagramPayload }
  | { type: "artifact_updated"; paths: string[] }
  | { type: "error"; message: string }
  | { type: "done" };

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type WorkspaceArtifacts = {
  appBrief: string | null;
  activeChangeName: string | null;
  proposal: string | null;
  design: string | null;
  tasks: string | null;
  taskProgress: TaskProgress;
  specs: Array<{
    name: string;
    path: string;
    content: string;
  }>;
};
