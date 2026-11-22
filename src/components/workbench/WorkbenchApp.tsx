"use client";

import React, { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowRight,
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
import { useI18n } from "./I18nProvider";
import {
  QuestionGroupCard,
  type QuestionAnswersMap,
} from "./QuestionGroupCard";
import { MermaidDiagramCard } from "./MermaidDiagramCard";
import { ArtifactInspector } from "./ArtifactInspector";
import { AppPreviewPanel } from "./AppPreviewPanel";

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

export function unwrapMarkdownCodeFences(text: string): string {
  const lines = text.split(/\r?\n/);
  const result: string[] = [];
  let inMarkdownFence = false;
  let inNestedFence = false;

  for (const line of lines) {
    if (!inMarkdownFence && /^```(?:markdown|md)\s*$/i.test(line)) {
      inMarkdownFence = true;
      continue;
    }

    if (inMarkdownFence) {
      if (!inNestedFence && /^```[a-zA-Z0-9_-]+/.test(line)) {
        inNestedFence = true;
        result.push(line);
        continue;
      }
      if (inNestedFence && /^```\s*$/.test(line)) {
        inNestedFence = false;
        result.push(line);
        continue;
      }
      if (!inNestedFence && /^```\s*$/.test(line)) {
        inMarkdownFence = false;
        continue;
      }
    }

    result.push(line);
  }

  return result.join("\n");
}

export function splitMarkdownAndMermaid(text: string): Array<{ kind: "markdown" | "mermaid"; content: string }> {
  const normalized = unwrapMarkdownCodeFences(text);
  const parts: Array<{ kind: "markdown" | "mermaid"; content: string }> = [];
  const regex = /```mermaid\s*\r?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ kind: "markdown", content: normalized.slice(lastIndex, match.index) });
    }
    parts.push({ kind: "mermaid", content: match[1].trim() });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < normalized.length) {
    parts.push({ kind: "markdown", content: normalized.slice(lastIndex) });
  }
  return parts;
}

function ActivityRow({ activity, detailsLabel }: { activity: ToolActivityEvent; detailsLabel: string }) {
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
            {detailsLabel}
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
  const { locale, t } = useI18n();
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
    test: [],
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
    void fetch("/api/workspace/preview", { method: "DELETE" }).catch(() => undefined);
    try {
      const res = await fetch("/api/workspace/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: folderPath, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWorkspaceError(data.error ?? t.validation.unableToLoad);
        return;
      }
      setWorkspaceState(data.state as WorkspaceState);
      setArtifacts(data.artifacts as WorkspaceArtifacts);
      setActiveStage((data.state as WorkspaceState).recommendedStage);
    } catch {
      setWorkspaceError(t.workbench.connectionFailed);
    } finally {
      setIsLoadingWorkspace(false);
    }
  }, [locale, t.validation.unableToLoad, t.workbench.connectionFailed]);

  const handleCreateWorkspace = useCallback(async (projectName: string) => {
    setIsLoadingWorkspace(true);
    setWorkspaceError(null);
    void fetch("/api/workspace/preview", { method: "DELETE" }).catch(() => undefined);
    try {
      const res = await fetch("/api/workspace/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWorkspaceError(data.error ?? t.validation.unableToLoad);
        return;
      }
      setWorkspaceState(data.state as WorkspaceState);
      setArtifacts(data.artifacts as WorkspaceArtifacts);
      setActiveStage((data.state as WorkspaceState).recommendedStage);
    } catch {
      setWorkspaceError(t.workbench.connectionFailed);
    } finally {
      setIsLoadingWorkspace(false);
    }
  }, [locale, t.validation.unableToLoad, t.workbench.connectionFailed]);

  const refreshWorkspaceState = useCallback(async (rootPath: string) => {
    try {
      const res = await fetch(
        `/api/workspace/artifacts?path=${encodeURIComponent(rootPath)}&locale=${locale}`,
      );
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
  }, [locale]);

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
        .map((tEntry) => {
          const text = tEntry.text.trim();
          const diagramSummary =
            tEntry.role === "assistant" && tEntry.diagrams.length > 0
              ? tEntry.diagrams
                  .map((d) => `[Diagram: ${d.title ?? t.diagramCard.defaultTitle}]`)
                  .join("\n")
              : "";
          const questionSummary =
            tEntry.role === "assistant" && tEntry.questionGroup
              ? t.workbench.questionSummaryPrefix(
                  tEntry.questionGroup.title ?? t.questionCard.defaultTitle,
                  tEntry.questionGroup.questions.map((q) => q.prompt).join("; "),
                )
              : "";

          const combined = [text, diagramSummary, questionSummary].filter(Boolean).join("\n\n");
          if (combined.length > 0) {
            return { role: tEntry.role, content: combined };
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
            locale,
            messages: nextMessages,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const errJson = await res.json().catch(() => ({ error: t.workbench.requestFailed }));
          updateAssistant((entry) => ({
            ...entry,
            error: errJson.error ?? t.workbench.requestFailed,
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
            error: err instanceof Error ? err.message : t.workbench.streamInterrupted,
          }));
        }
      } finally {
        if (abortRef.current === controller) {
          setIsStreaming(false);
          abortRef.current = null;
        }
      }
    },
    [
      workspaceState,
      isStreaming,
      activeStage,
      turnsByStage,
      refreshWorkspaceState,
      locale,
      t.diagramCard.defaultTitle,
      t.questionCard.defaultTitle,
      t.workbench,
    ],
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
              ? t.questionCard.yes
              : t.questionCard.no
            : Array.isArray(val)
              ? val.join(", ")
              : String(val ?? "");
        return `- **${q.prompt}**: ${printable}`;
      })
      .join("\n");

    void runTurn(`${t.workbench.answersHeader}\n${formatted}`, undefined, true);
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
        onCreateWorkspace={handleCreateWorkspace}
        onSelectStage={(stage) => setActiveStage(stage)}
      />

      <div className="grid flex-1 min-h-0 grid-cols-1 lg:grid-cols-[1fr_420px]">
        <section className="flex min-h-0 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto max-w-3xl space-y-5">
              {workspaceState && activeStage === "test" && (
                <AppPreviewPanel projectRoot={workspaceState.rootPath} />
              )}
              {!workspaceState ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-primary" />
                  <h2 className="mt-3 text-base font-semibold">{t.workbench.openWorkspaceTitle}</h2>
                  <p className="mx-auto mt-1.5 max-w-md text-xs text-muted-foreground">
                    {t.workbench.openWorkspaceBodyPrefix}{" "}
                    <code className="rounded bg-muted px-1">dept-app-brief</code>{" "}
                    {t.workbench.openWorkspaceBodySuffix}
                  </p>
                </div>
              ) : currentTurns.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-2xs">
                  <Badge variant="secondary" className="mb-2 uppercase">
                    {t.workbench.stageBadge(t.stages[activeStage].label)}
                  </Badge>
                  <h2 className="text-base font-semibold">
                    {t.workbench.readyTitle(t.stages[activeStage].label)}
                  </h2>
                  <p className="mx-auto mt-1.5 max-w-lg text-xs text-muted-foreground">
                    {t.workbench.readyBodyPrefix}{" "}
                    <span className="font-mono font-medium">{workspaceState.projectName}</span>{" "}
                    {t.workbench.readyBodySuffix}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => void runTurn(t.stages[activeStage].starterPrompt)}
                    disabled={isStreaming}
                  >
                    <Play className="h-3.5 w-3.5" />
                    {t.workbench.startSession(t.stages[activeStage].label)}
                  </Button>
                </div>
              ) : (
                currentTurns.map((turn, idx) => (
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
                                <ActivityRow
                                  key={act.id}
                                  activity={act}
                                  detailsLabel={t.workbench.details}
                                />
                              ))}
                            </div>
                          )}

                          {isStreaming &&
                            idx === currentTurns.length - 1 &&
                            !turn.error &&
                            !turn.text &&
                            turn.diagrams.length === 0 &&
                            !turn.questionGroup &&
                            !turn.activities.some((a) => a.status === "running") && (
                              <div
                                role="status"
                                aria-live="polite"
                                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs text-muted-foreground shadow-2xs"
                              >
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                <span>{t.workbench.thinking}</span>
                              </div>
                            )}

                          {turn.text && (
                            <div className="min-w-0 max-w-full space-y-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-relaxed shadow-2xs">
                              {splitMarkdownAndMermaid(turn.text).map((part, idx) =>
                                part.kind === "mermaid" ? (
                                  <MermaidDiagramCard
                                    key={`${turn.id}-mmd-${idx}`}
                                    mermaidCode={part.content}
                                  />
                                ) : (
                                  <div
                                    key={`${turn.id}-md-${idx}`}
                                    className="min-w-0 max-w-full space-y-2.5 break-words text-xs leading-relaxed [&_h1]:pt-1 [&_h1]:text-base [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h2]:border-b [&_h2]:border-border/60 [&_h2]:pt-2 [&_h2]:pb-1 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:pt-1.5 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-foreground [&_strong]:font-semibold [&_strong]:text-foreground [&_em]:italic [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_hr]:my-2 [&_hr]:border-border/80 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[11px] [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border/80 [&_pre]:bg-muted/60 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-[11px] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-[11px] [&_th]:border [&_th]:border-border [&_th]:bg-muted/60 [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-2.5 [&_td]:py-1.5 [&_td]:align-top"
                                  >
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        table: ({ children, ...props }) => (
                                          <div className="max-w-full overflow-x-auto">
                                            <table {...props}>{children}</table>
                                          </div>
                                        ),
                                      }}
                                    >
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

          {!isStreaming &&
            workspaceState &&
            currentTurns.length > 0 &&
            !hasPendingQuestionCard &&
            workspaceState.recommendedStage !== activeStage && (
              <div className="border-t border-primary/20 bg-primary/5 px-4 py-2.5">
                <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
                  <span className="text-xs font-medium text-foreground">
                    {t.workbench.stageHandoffTitle(t.stages[workspaceState.recommendedStage].label)}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setActiveStage(workspaceState.recommendedStage)}
                  >
                    {t.workbench.stageHandoffAction(
                      t.stages[workspaceState.recommendedStage].label,
                    )}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

          <form
            onSubmit={handleComposerSubmit}
            className="border-t border-border bg-card px-4 py-3"
          >
            <div className="mx-auto flex max-w-3xl items-end gap-2">
              <Textarea
                rows={2}
                placeholder={
                  !workspaceState
                    ? t.workbench.composerNoWorkspace
                    : hasPendingQuestionCard
                      ? t.workbench.composerPendingQuestions
                      : t.workbench.composerPlaceholder(t.stages[activeStage].label)
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
