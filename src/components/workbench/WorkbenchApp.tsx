"use client";

import React, { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Play,
  Send,
  Sparkles,
  User,
  Wrench,
  XCircle,
} from "lucide-react";
import type {
  AgentSseEvent,
  ConversationMessage,
  DiagramPayload,
  QuestionGroupPayload,
  StageId,
  ToolActivityEvent,
  WorkspaceArtifacts,
  WorkspaceState,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceHeader } from "./WorkspaceHeader";
import {
  QuestionGroupCard,
  type QuestionAnswersMap,
} from "./QuestionGroupCard";
import { MermaidDiagramCard } from "./MermaidDiagramCard";
import { ArtifactInspector } from "./ArtifactInspector";

type TurnEntry = {
  id: string;
  role: "user" | "assistant";
  text: string;
  activities: ToolActivityEvent[];
  diagrams: DiagramPayload[];
  questionGroup?: QuestionGroupPayload;
  submittedAnswers?: QuestionAnswersMap;
  error?: string;
};

const STAGE_STARTER_PROMPTS: Record<StageId, string> = {
  brief:
    "Please start the functional brief interview. First inspect the project workspace for any existing files, then guide me step-by-step.",
  explore:
    "Let's explore the requirements and architecture based on app-brief.md and the workspace. Please summarize what you find and highlight key questions or diagrams.",
  propose:
    "Let's propose a complete OpenSpec change (proposal, specs, design, and tasks) based on app-brief.md and our exploration.",
  apply:
    "Please inspect the active OpenSpec change tasks and begin implementing the next pending tasks step by step.",
  archive:
    "Please verify whether all tasks are complete and guide me through archiving the completed OpenSpec change.",
};

function splitMarkdownAndMermaid(text: string): Array<{ kind: "markdown" | "mermaid"; content: string }> {
  const parts: Array<{ kind: "markdown" | "mermaid"; content: string }> = [];
  const regex = /```mermaid\s*\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ kind: "markdown", content: text.slice(lastIndex, match.index) });
    }
    parts.push({ kind: "mermaid", content: match[1].trim() });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ kind: "markdown", content: text.slice(lastIndex) });
  }
  return parts;
}

function ActivityRow({ activity }: { activity: ToolActivityEvent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {activity.status === "running" && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          )}
          {activity.status === "done" && (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          )}
          {activity.status === "error" && (
            <XCircle className="h-3.5 w-3.5 text-destructive" />
          )}
          <Wrench className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium text-foreground">{activity.label}</span>
        </div>
        {activity.detail && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Details
          </button>
        )}
      </div>
      {expanded && activity.detail && (
        <pre className="mt-2 max-h-40 overflow-auto rounded bg-background p-2 font-mono text-[11px] text-muted-foreground">
          {activity.detail}
        </pre>
      )}
    </div>
  );
}

export function WorkbenchApp({ defaultWorkspacePath }: { defaultWorkspacePath?: string }) {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState | null>(null);
  const [artifacts, setArtifacts] = useState<WorkspaceArtifacts | null>(null);
  const [activeStage, setActiveStage] = useState<StageId>("brief");
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const [turnsByStage, setTurnsByStage] = useState<Record<StageId, TurnEntry[]>>({
    brief: [],
    explore: [],
    propose: [],
    apply: [],
    archive: [],
  });
  const [composerText, setComposerText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const currentTurns = turnsByStage[activeStage];
  const hasPendingQuestionCard = currentTurns.some(
    (t) => t.questionGroup && !t.submittedAnswers,
  );

  const handleSelectWorkspace = useCallback(async (folderPath: string) => {
    setIsLoadingWorkspace(true);
    setWorkspaceError(null);
    try {
      const res = await fetch("/api/workspace/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: folderPath }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWorkspaceError(data.error ?? "Unable to load project workspace.");
        return;
      }
      setWorkspaceState(data.state as WorkspaceState);
      setArtifacts(data.artifacts as WorkspaceArtifacts);
      setActiveStage((data.state as WorkspaceState).recommendedStage);
    } catch {
      setWorkspaceError("Failed to connect to the local workbench server.");
    } finally {
      setIsLoadingWorkspace(false);
    }
  }, []);

  const refreshWorkspaceState = useCallback(async (rootPath: string) => {
    try {
      const res = await fetch(`/api/workspace/artifacts?path=${encodeURIComponent(rootPath)}`);
      if (res.ok) {
        const data = (await res.json()) as {
          state: WorkspaceState;
          artifacts: WorkspaceArtifacts;
        };
        setWorkspaceState(data.state);
        setArtifacts(data.artifacts);
      }
    } catch {
      // ignore transient refresh failure
    }
  }, []);

  const runTurn = useCallback(
    async (userMessage: string, stageOverride?: StageId, force = false) => {
      if (!workspaceState || (isStreaming && !force)) return;
      if (force && abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      const stage = stageOverride ?? activeStage;

      const userTurn: TurnEntry = {
        id: `user-${Date.now()}`,
        role: "user",
        text: userMessage,
        activities: [],
        diagrams: [],
      };
      const assistantId = `asst-${Date.now() + 1}`;
      const assistantTurn: TurnEntry = {
        id: assistantId,
        role: "assistant",
        text: "",
        activities: [],
        diagrams: [],
      };

      const priorHistory: ConversationMessage[] = turnsByStage[stage]
        .map((t) => {
          const text = t.text.trim();
          if (text.length > 0) {
            return { role: t.role, content: text };
          }
          if (t.role === "assistant" && t.questionGroup) {
            const prompts = t.questionGroup.questions.map((q) => q.prompt).join("; ");
            return {
              role: "assistant" as const,
              content: `Asked structured questions (${t.questionGroup.title ?? "Questions"}): ${prompts}`,
            };
          }
          return null;
        })
        .filter((m): m is ConversationMessage => m !== null);

      const nextMessages: ConversationMessage[] = [
        ...priorHistory,
        { role: "user", content: userMessage },
      ];

      setTurnsByStage((prev) => ({
        ...prev,
        [stage]: [...prev[stage], userTurn, assistantTurn],
      }));
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const updateAssistant = (updater: (entry: TurnEntry) => TurnEntry) => {
        setTurnsByStage((prev) => ({
          ...prev,
          [stage]: prev[stage].map((entry) =>
            entry.id === assistantId ? updater(entry) : entry,
          ),
        }));
      };

      try {
        const res = await fetch("/api/agent/turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectRoot: workspaceState.rootPath,
            stage,
            messages: nextMessages,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const errJson = await res.json().catch(() => ({ error: "Agent request failed." }));
          updateAssistant((entry) => ({
            ...entry,
            error: errJson.error ?? "Agent request failed.",
          }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const dataLine = frame.split("\n").find((l) => l.startsWith("data: "));
            if (!dataLine) continue;

            const evt = JSON.parse(dataLine.slice(6)) as AgentSseEvent;
            if (evt.type === "text_delta") {
              updateAssistant((entry) => ({ ...entry, text: entry.text + evt.delta }));
            } else if (evt.type === "tool_activity") {
              updateAssistant((entry) => {
                const exists = entry.activities.some((a) => a.id === evt.activity.id);
                return {
                  ...entry,
                  activities: exists
                    ? entry.activities.map((a) =>
                        a.id === evt.activity.id ? evt.activity : a,
                      )
                    : [...entry.activities, evt.activity],
                };
              });
            } else if (evt.type === "question_group") {
              updateAssistant((entry) => ({ ...entry, questionGroup: evt.payload }));
            } else if (evt.type === "diagram") {
              updateAssistant((entry) => ({
                ...entry,
                diagrams: [...entry.diagrams, evt.payload],
              }));
            } else if (evt.type === "artifact_updated") {
              setRefreshToken((n) => n + 1);
              void refreshWorkspaceState(workspaceState.rootPath);
            } else if (evt.type === "error") {
              updateAssistant((entry) => ({ ...entry, error: evt.message }));
            } else if (evt.type === "done") {
              if (abortRef.current === controller) {
                setIsStreaming(false);
              }
            }
          }
        }
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== "AbortError") {
          updateAssistant((entry) => ({
            ...entry,
            error: err instanceof Error ? err.message : "Streaming connection interrupted.",
          }));
        }
      } finally {
        if (abortRef.current === controller) {
          setIsStreaming(false);
          abortRef.current = null;
        }
      }
    },
    [workspaceState, isStreaming, activeStage, turnsByStage, refreshWorkspaceState],
  );

  const handleSubmitQuestionCard = (turnId: string, payload: QuestionGroupPayload, answers: QuestionAnswersMap) => {
    setTurnsByStage((prev) => ({
      ...prev,
      [activeStage]: prev[activeStage].map((entry) =>
        entry.id === turnId ? { ...entry, submittedAnswers: answers } : entry,
      ),
    }));

    const formatted = payload.questions
      .map((q) => {
        const val = answers[q.id];
        const printable =
          typeof val === "boolean"
            ? val
              ? "Yes"
              : "No"
            : Array.isArray(val)
              ? val.join(", ")
              : String(val ?? "");
        return `- **${q.prompt}**: ${printable}`;
      })
      .join("\n");

    void runTurn(`Here are my answers:\n${formatted}`, undefined, true);
  };

  const handleComposerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim() || isStreaming || hasPendingQuestionCard || !workspaceState) return;
    const text = composerText.trim();
    setComposerText("");
    void runTurn(text);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <WorkspaceHeader
        workspaceState={workspaceState}
        activeStage={activeStage}
        initialPath={defaultWorkspacePath}
        isLoadingWorkspace={isLoadingWorkspace}
        workspaceError={workspaceError}
        onSelectWorkspace={handleSelectWorkspace}
        onSelectStage={(stage) => setActiveStage(stage)}
      />

      <div className="grid flex-1 min-h-0 grid-cols-1 lg:grid-cols-[1fr_420px]">
        <section className="flex min-h-0 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto max-w-3xl space-y-5">
              {!workspaceState ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-primary" />
                  <h2 className="mt-3 text-base font-semibold">Open a local project workspace</h2>
                  <p className="mx-auto mt-1.5 max-w-md text-xs text-muted-foreground">
                    Enter the path to a cloned <code className="rounded bg-muted px-1">dept-app-brief</code>{" "}
                    or OpenSpec project folder above to launch the guided visual workbench.
                  </p>
                </div>
              ) : currentTurns.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-2xs">
                  <Badge variant="secondary" className="mb-2 uppercase">
                    Stage: {activeStage}
                  </Badge>
                  <h2 className="text-base font-semibold">
                    Ready to start the {activeStage.charAt(0).toUpperCase() + activeStage.slice(1)} stage
                  </h2>
                  <p className="mx-auto mt-1.5 max-w-lg text-xs text-muted-foreground">
                    Click below to let the assistant inspect{" "}
                    <span className="font-mono font-medium">{workspaceState.projectName}</span> and
                    guide you with structured question cards and visual diagrams.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => void runTurn(STAGE_STARTER_PROMPTS[activeStage])}
                    disabled={isStreaming}
                  >
                    <Play className="h-3.5 w-3.5" />
                    Start {activeStage.charAt(0).toUpperCase() + activeStage.slice(1)} Session
                  </Button>
                </div>
              ) : (
                currentTurns.map((turn) => (
                  <div key={turn.id} className="space-y-3">
                    {turn.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="flex max-w-[85%] items-start gap-2.5 rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-2xs">
                          <User className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
                          <div className="whitespace-pre-wrap text-xs leading-relaxed">{turn.text}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-3">
                          {turn.activities.length > 0 && (
                            <div className="space-y-1.5">
                              {turn.activities.map((act) => (
                                <ActivityRow key={act.id} activity={act} />
                              ))}
                            </div>
                          )}

                          {turn.text && (
                            <div className="space-y-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-relaxed shadow-2xs">
                              {splitMarkdownAndMermaid(turn.text).map((part, idx) =>
                                part.kind === "mermaid" ? (
                                  <MermaidDiagramCard
                                    key={`${turn.id}-mmd-${idx}`}
                                    mermaidCode={part.content}
                                  />
                                ) : (
                                  <div
                                    key={`${turn.id}-md-${idx}`}
                                    className="space-y-2 text-xs leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1"
                                  >
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {part.content}
                                    </ReactMarkdown>
                                  </div>
                                ),
                              )}
                            </div>
                          )}

                          {turn.diagrams.map((diag) => (
                            <MermaidDiagramCard
                              key={diag.id}
                              title={diag.title}
                              mermaidCode={diag.mermaid}
                            />
                          ))}

                          {turn.questionGroup && (
                            <QuestionGroupCard
                              payload={turn.questionGroup}
                              submittedAnswers={turn.submittedAnswers}
                              onSubmit={(answers) =>
                                handleSubmitQuestionCard(turn.id, turn.questionGroup!, answers)
                              }
                            />
                          )}

                          {turn.error && (
                            <div
                              role="alert"
                              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                            >
                              {turn.error}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <form
            onSubmit={handleComposerSubmit}
            className="border-t border-border bg-card px-4 py-3"
          >
            <div className="mx-auto flex max-w-3xl items-end gap-2">
              <Textarea
                rows={2}
                placeholder={
                  !workspaceState
                    ? "Open a project folder above to start..."
                    : hasPendingQuestionCard
                      ? "Please answer the question card above to continue..."
                      : `Message the ${activeStage} assistant...`
                }
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                disabled={!workspaceState || isStreaming || hasPendingQuestionCard}
                className="min-h-[44px] resize-none text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleComposerSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                disabled={
                  !workspaceState ||
                  isStreaming ||
                  hasPendingQuestionCard ||
                  !composerText.trim()
                }
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </section>

        <div className="hidden min-h-0 lg:block">
          <ArtifactInspector
            projectRoot={workspaceState?.rootPath ?? null}
            artifacts={artifacts}
            refreshToken={refreshToken}
            onArtifactsRefreshed={setArtifacts}
          />
        </div>
      </div>
    </div>
  );
}
