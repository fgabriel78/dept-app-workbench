import type { StageId } from "@/lib/types";

export const SUPPORTED_LOCALES = ["en", "es", "ca"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  es: "ES",
  ca: "CA",
};

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  ca: "Català",
};

export type TranslationDictionary = {
  header: {
    appTitle: string;
    appSubtitle: string;
    pathPlaceholder: string;
    pathAriaLabel: string;
    openProject: string;
    loading: string;
    modeOpen: string;
    modeCreate: string;
    projectNamePlaceholder: string;
    projectNameAriaLabel: string;
    createProject: string;
    creating: string;
    lifecycleNavAria: string;
    languageAria: string;
  };
  stages: Record<
    StageId,
    {
      label: string;
      shortDescription: string;
      description: string;
      starterPrompt: string;
    }
  >;
  workbench: {
    openWorkspaceTitle: string;
    openWorkspaceBodyPrefix: string;
    openWorkspaceBodySuffix: string;
    stageBadge: (stageLabel: string) => string;
    readyTitle: (stageLabel: string) => string;
    readyBodyPrefix: string;
    readyBodySuffix: string;
    startSession: (stageLabel: string) => string;
    details: string;
    composerNoWorkspace: string;
    composerPendingQuestions: string;
    composerPlaceholder: (stageLabel: string) => string;
    answersHeader: string;
    defaultAgentError: string;
    requestFailed: string;
    connectionFailed: string;
    streamInterrupted: string;
    thinking: string;
    stepLimitReached: string;
    stageHandoffTitle: (nextStageLabel: string) => string;
    stageHandoffAction: (nextStageLabel: string) => string;
    questionSummaryPrefix: (title: string, prompts: string) => string;
  };
  questionCard: {
    defaultTitle: string;
    defaultSubmittedTitle: string;
    submittedBadge: string;
    textPlaceholder: string;
    yes: string;
    no: string;
    submitAnswers: string;
  };
  diagramCard: {
    defaultTitle: string;
    zoomOut: string;
    zoomIn: string;
    resetZoom: string;
    showDiagram: string;
    showSource: string;
    renderFallbackTitle: string;
    rendering: string;
    invalidSyntax: string;
  };
  preview: {
    title: string;
    subtitle: string;
    sqliteBadge: string;
    start: string;
    restart: string;
    stop: string;
    starting: string;
    running: string;
    idle: string;
    error: string;
    openInNewTab: string;
    showLogs: string;
    hideLogs: string;
    noLogs: string;
  };
  artifacts: {
    title: string;
    refreshAria: string;
    taskProgress: string;
    tabs: {
      brief: string;
      proposal: string;
      design: string;
      specs: string;
      tasks: string;
    };
    emptyBrief: string;
    emptyProposal: string;
    emptyDesign: string;
    emptySpecs: string;
    emptyTasks: string;
  };
  validation: {
    emptyPath: string;
    missingFolder: (trimmed: string) => string;
    unreadableFolder: (trimmed: string) => string;
    fileNotFolder: (trimmed: string) => string;
    missingMarkers: string;
    invalidJson: string;
    invalidPath: string;
    unableToLoad: string;
    emptyProjectName: string;
    invalidProjectName: string;
    projectAlreadyExists: (folderName: string) => string;
    cloneFailed: (detail?: string) => string;
  };
  tools: {
    workspaceRoot: string;
    reading: (filePath: string) => string;
    read: (filePath: string) => string;
    failedRead: (filePath: string) => string;
    inspecting: (target: string) => string;
    listed: (target: string, count: number) => string;
    failedList: (target: string) => string;
    writing: (filePath: string) => string;
    updated: (filePath: string) => string;
    failedWrite: (filePath: string) => string;
    editing: (filePath: string) => string;
    edited: (filePath: string) => string;
    failedEdit: (filePath: string) => string;
    running: (cmd: string) => string;
    completedCommand: (cmd: string) => string;
    exitedCommand: (code: number) => string;
    commandBlocked: string;
    defaultDiagramTitle: string;
  };
};
