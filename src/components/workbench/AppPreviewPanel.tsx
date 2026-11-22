"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Database,
  ExternalLink,
  Loader2,
  Play,
  RotateCw,
  Square,
  Terminal,
} from "lucide-react";
import type { PreviewStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "./I18nProvider";

export function AppPreviewPanel({ projectRoot }: { projectRoot: string }) {
  const { locale, t } = useI18n();
  const [preview, setPreview] = useState<PreviewStatus>({
    status: "idle",
    projectRoot: null,
    port: null,
    url: null,
    logs: [],
    error: null,
  });
  const [isBusy, setIsBusy] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/preview");
      if (res.ok) {
        const data = (await res.json()) as { preview: PreviewStatus };
        setPreview(data.preview);
      }
    } catch {
      // ignore transient poll failure
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (preview.status !== "starting" && preview.status !== "running") return;
    const timer = setInterval(() => {
      void refreshStatus();
    }, 3000);
    return () => clearInterval(timer);
  }, [preview.status, refreshStatus]);

  const handleStart = async () => {
    setIsBusy(true);
    setPreview((prev) => ({ ...prev, status: "starting", error: null }));
    try {
      const res = await fetch("/api/workspace/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectRoot, locale }),
      });
      const data = (await res.json()) as { preview?: PreviewStatus; error?: string };
      if (data.preview) {
        setPreview(data.preview);
      } else if (data.error) {
        setPreview((prev) => ({ ...prev, status: "error", error: data.error ?? null }));
      }
    } catch {
      setPreview((prev) => ({ ...prev, status: "error", error: t.workbench.connectionFailed }));
    } finally {
      setIsBusy(false);
    }
  };

  const handleStop = async () => {
    setIsBusy(true);
    try {
      const res = await fetch("/api/workspace/preview", { method: "DELETE" });
      if (res.ok) {
        const data = (await res.json()) as { preview: PreviewStatus };
        setPreview(data.preview);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const isRunningHere = preview.status === "running" && preview.projectRoot === projectRoot && preview.url;

  return (
    <Card className="border-border bg-card shadow-2xs">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 border-b border-border/60 py-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">{t.preview.title}</CardTitle>
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <Database className="h-3 w-3" />
              {t.preview.sqliteBadge}
            </Badge>
            <Badge
              variant={
                isRunningHere
                  ? "success"
                  : preview.status === "error"
                    ? "destructive"
                    : "outline"
              }
              className="text-[11px]"
            >
              {isBusy || preview.status === "starting"
                ? t.preview.starting
                : isRunningHere
                  ? t.preview.running
                  : preview.status === "error"
                    ? t.preview.error
                    : t.preview.idle}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{t.preview.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {!isRunningHere ? (
            <Button type="button" size="sm" onClick={() => void handleStart()} disabled={isBusy}>
              {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {t.preview.start}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleStart()}
                disabled={isBusy}
              >
                <RotateCw className="h-3.5 w-3.5" />
                {t.preview.restart}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleStop()}
                disabled={isBusy}
              >
                <Square className="h-3.5 w-3.5" />
                {t.preview.stop}
              </Button>
              <a
                href={preview.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-accent"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t.preview.openInNewTab}
              </a>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-3">
        {preview.error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {preview.error}
          </div>
        )}

        {isRunningHere && (
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <iframe
              title={t.preview.title}
              src={preview.url!}
              className="h-[420px] w-full border-0"
            />
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => setShowLogs((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {showLogs ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Terminal className="h-3.5 w-3.5" />
            {showLogs ? t.preview.hideLogs : t.preview.showLogs}
          </button>
          {showLogs && (
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-border/80 bg-muted/50 p-2.5 font-mono text-[11px] text-muted-foreground">
              {preview.logs.length > 0 ? preview.logs.join("\n") : t.preview.noLogs}
            </pre>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
