"use client";

import React, { useEffect, useState } from "react";
import {
  Check,
  ChevronRight,
  FolderOpen,
  FolderPlus,
  Globe,
  Layers,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { LOCALE_LABELS, LOCALE_NAMES, SUPPORTED_LOCALES } from "@/lib/i18n";
import { STAGES, type StageId, type WorkspaceState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "./I18nProvider";

export type WorkspaceHeaderProps = {
  workspaceState: WorkspaceState | null;
  activeStage: StageId;
  initialPath?: string;
  isLoadingWorkspace?: boolean;
  workspaceError?: string | null;
  onSelectWorkspace: (folderPath: string) => void | Promise<void>;
  onCreateWorkspace?: (projectName: string) => void | Promise<void>;
  onSelectStage: (stage: StageId) => void;
};

export function WorkspaceHeader({
  workspaceState,
  activeStage,
  initialPath = "",
  isLoadingWorkspace = false,
  workspaceError = null,
  onSelectWorkspace,
  onCreateWorkspace,
  onSelectStage,
}: WorkspaceHeaderProps) {
  const { locale, setLocale, t } = useI18n();
  const [mode, setMode] = useState<"open" | "create">("open");
  const [pathInput, setPathInput] = useState(initialPath || workspaceState?.rootPath || "");
  const [projectNameInput, setProjectNameInput] = useState("");

  useEffect(() => {
    if (workspaceState?.rootPath) {
      setPathInput(workspaceState.rootPath);
    }
  }, [workspaceState?.rootPath]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "open") {
      if (!pathInput.trim()) return;
      void onSelectWorkspace(pathInput.trim());
    } else {
      if (!projectNameInput.trim()) return;
      void onCreateWorkspace?.(projectNameInput.trim());
    }
  };

  const stages =
    workspaceState?.stages ??
    STAGES.map((id) => ({
      id,
      label: t.stages[id].label,
      description: t.stages[id].shortDescription,
      status: "upcoming" as const,
    }));

  return (
    <header className="border-b border-border bg-card/90 backdrop-blur-xs">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-tight">{t.header.appTitle}</h1>
                {workspaceState && (
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {workspaceState.projectName}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t.header.appSubtitle}</p>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <div
              role="tablist"
              aria-label="Workspace mode"
              className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "open"}
                onClick={() => setMode("open")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer",
                  mode === "open"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {t.header.modeOpen}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "create"}
                onClick={() => setMode("create")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer",
                  mode === "create"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {t.header.modeCreate}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 max-w-xl items-center gap-2">
              {mode === "open" ? (
                <div className="relative flex-1">
                  <FolderOpen className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label={t.header.pathAriaLabel}
                    placeholder={t.header.pathPlaceholder}
                    value={pathInput}
                    onChange={(e) => setPathInput(e.target.value)}
                    className="pl-8 font-mono text-xs"
                  />
                </div>
              ) : (
                <div className="relative flex-1">
                  <FolderPlus className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label={t.header.projectNameAriaLabel}
                    placeholder={t.header.projectNamePlaceholder}
                    value={projectNameInput}
                    onChange={(e) => setProjectNameInput(e.target.value)}
                    className="pl-8 text-xs"
                  />
                </div>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={
                  isLoadingWorkspace ||
                  (mode === "open" ? !pathInput.trim() : !projectNameInput.trim())
                }
              >
                {isLoadingWorkspace ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {mode === "open" ? t.header.loading : t.header.creating}
                  </>
                ) : mode === "open" ? (
                  t.header.openProject
                ) : (
                  t.header.createProject
                )}
              </Button>
            </form>

            <div
              role="group"
              aria-label={t.header.languageAria}
              className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5"
            >
              <Globe className="mx-1.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              {SUPPORTED_LOCALES.map((loc) => {
                const active = locale === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    aria-pressed={active}
                    title={LOCALE_NAMES[loc]}
                    onClick={() => setLocale(loc)}
                    className={cn(
                      "rounded-md px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {LOCALE_LABELS[loc]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {workspaceError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{workspaceError}</span>
          </div>
        )}

        <nav aria-label={t.header.lifecycleNavAria} className="flex flex-wrap items-center gap-1.5">
          {stages.map((stage, idx) => {
            const isActive = activeStage === stage.id;
            const isCompleted = stage.status === "completed";
            const stageText = t.stages[stage.id];
            return (
              <React.Fragment key={stage.id}>
                <button
                  type="button"
                  disabled={!workspaceState}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => onSelectStage(stage.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-left transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                    isActive
                      ? "border-primary bg-primary/10 text-primary shadow-2xs"
                      : isCompleted
                        ? "border-emerald-200 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-50"
                        : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isCompleted ? <Check className="h-3 w-3" /> : idx + 1}
                  </span>
                  <div className="leading-tight">
                    <div className="text-xs font-semibold">{stageText.label}</div>
                    <div className="hidden text-[10px] opacity-80 sm:block">
                      {stageText.shortDescription}
                    </div>
                  </div>
                </button>
                {idx < stages.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
