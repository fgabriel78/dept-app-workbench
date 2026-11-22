"use client";

import React, { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckSquare, FileText, RefreshCw } from "lucide-react";
import type { WorkspaceArtifacts } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "./I18nProvider";

export type ArtifactInspectorProps = {
  projectRoot: string | null;
  artifacts: WorkspaceArtifacts | null;
  refreshToken: number;
  onArtifactsRefreshed?: (artifacts: WorkspaceArtifacts) => void;
};

function MarkdownPreview({ content, emptyText }: { content: string | null; emptyText: string }) {
  if (!content) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        {emptyText}
      </div>
    );
  }
  return (
    <article className="prose prose-sm max-w-none space-y-3 text-xs leading-relaxed text-foreground [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-xs [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </article>
  );
}

export function ArtifactInspector({
  projectRoot,
  artifacts: initialArtifacts,
  refreshToken,
  onArtifactsRefreshed,
}: ArtifactInspectorProps) {
  const { locale, t } = useI18n();
  const [artifacts, setArtifacts] = useState<WorkspaceArtifacts | null>(initialArtifacts);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setArtifacts(initialArtifacts);
  }, [initialArtifacts]);

  const fetchArtifacts = useCallback(async () => {
    if (!projectRoot) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(
        `/api/workspace/artifacts?path=${encodeURIComponent(projectRoot)}&locale=${locale}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { artifacts: WorkspaceArtifacts };
        setArtifacts(data.artifacts);
        onArtifactsRefreshed?.(data.artifacts);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [projectRoot, locale, onArtifactsRefreshed]);

  useEffect(() => {
    if (refreshToken > 0 && projectRoot) {
      void fetchArtifacts();
    }
  }, [refreshToken, projectRoot, fetchArtifacts]);

  const progress = artifacts?.taskProgress ?? { total: 0, completed: 0, remaining: 0 };
  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <aside className="flex h-full flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">{t.artifacts.title}</h2>
          {artifacts?.activeChangeName && (
            <Badge variant="outline" className="font-mono text-[10px]">
              {artifacts.activeChangeName}
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t.artifacts.refreshAria}
          disabled={!projectRoot || isRefreshing}
          onClick={() => void fetchArtifacts()}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {progress.total > 0 && (
        <div className="border-b border-border bg-muted/30 px-4 py-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
              {t.artifacts.taskProgress}
            </span>
            <span className="font-mono text-muted-foreground">
              {progress.completed}/{progress.total} ({pct}%)
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="brief">
          <TabsList className="w-full justify-between">
            <TabsTrigger value="brief">{t.artifacts.tabs.brief}</TabsTrigger>
            <TabsTrigger value="proposal">{t.artifacts.tabs.proposal}</TabsTrigger>
            <TabsTrigger value="design">{t.artifacts.tabs.design}</TabsTrigger>
            <TabsTrigger value="specs">{t.artifacts.tabs.specs}</TabsTrigger>
            <TabsTrigger value="tasks">{t.artifacts.tabs.tasks}</TabsTrigger>
          </TabsList>

          <TabsContent value="brief">
            <MarkdownPreview
              content={artifacts?.appBrief ?? null}
              emptyText={t.artifacts.emptyBrief}
            />
          </TabsContent>

          <TabsContent value="proposal">
            <MarkdownPreview
              content={artifacts?.proposal ?? null}
              emptyText={t.artifacts.emptyProposal}
            />
          </TabsContent>

          <TabsContent value="design">
            <MarkdownPreview
              content={artifacts?.design ?? null}
              emptyText={t.artifacts.emptyDesign}
            />
          </TabsContent>

          <TabsContent value="specs">
            {artifacts && artifacts.specs.length > 0 ? (
              <div className="space-y-4">
                {artifacts.specs.map((spec) => (
                  <div key={spec.path} className="rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold">{spec.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{spec.path}</span>
                    </div>
                    <MarkdownPreview content={spec.content} emptyText="" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                {t.artifacts.emptySpecs}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks">
            <MarkdownPreview
              content={artifacts?.tasks ?? null}
              emptyText={t.artifacts.emptyTasks}
            />
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}
