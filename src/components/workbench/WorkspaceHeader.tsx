"use client";

import React, { useState } from "react";
import {
  Check,
  ChevronRight,
  FolderOpen,
  Layers,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { StageId, WorkspaceState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type WorkspaceHeaderProps = {
  workspaceState: WorkspaceState | null;
  activeStage: StageId;
  initialPath?: string;
  isLoadingWorkspace?: boolean;
  workspaceError?: string | null;
  onSelectWorkspace: (folderPath: string) => void | Promise<void>;
  onSelectStage: (stage: StageId) => void;
};

const DEFAULT_STAGE_META: Array<{ id: StageId; label: string; description: string }> = [
  { id: "brief", label: "Brief", description: "Functional interview" },
  { id: "explore", label: "Explore", description: "Read-only alignment" },
  { id: "propose", label: "Propose", description: "Specs & plan" },
  { id: "apply", label: "Apply", description: "Implement tasks" },
  { id: "archive", label: "Archive", description: "Finalize change" },
];

export function WorkspaceHeader({
  workspaceState,
  activeStage,
  initialPath = "",
  isLoadingWorkspace = false,
  workspaceError = null,
  onSelectWorkspace,
  onSelectStage,
}: WorkspaceHeaderProps) {
  const [pathInput, setPathInput] = useState(initialPath || workspaceState?.rootPath || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pathInput.trim()) return;
    void onSelectWorkspace(pathInput.trim());
  };

  const stages = workspaceState?.stages ?? DEFAULT_STAGE_META.map((s) => ({ ...s, status: "upcoming" as const }));

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
                <h1 className="text-sm font-semibold tracking-tight">Dept App Workbench</h1>
                {workspaceState && (
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {workspaceState.projectName}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Visual functional brief &amp; OpenSpec lifecycle studio
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-1 max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <FolderOpen className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Local project folder path"
                placeholder="Enter local project path (e.g. C:\Users\you\Dev\my-dept-app)"
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                className="pl-8 font-mono text-xs"
              />
            </div>
            <Button type="submit" size="sm" disabled={isLoadingWorkspace || !pathInput.trim()}>
              {isLoadingWorkspace ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading
                </>
              ) : (
                "Open Project"
              )}
            </Button>
          </form>
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

        <nav aria-label="Lifecycle stages" className="flex flex-wrap items-center gap-1.5">
          {stages.map((stage, idx) => {
            const isActive = activeStage === stage.id;
            const isCompleted = stage.status === "completed";
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
                    <div className="text-xs font-semibold">{stage.label}</div>
                    <div className="hidden text-[10px] opacity-80 sm:block">
                      {stage.description}
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
