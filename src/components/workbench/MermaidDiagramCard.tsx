"use client";

import React, { useEffect, useId, useState } from "react";
import { AlertTriangle, Code2, Eye, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type MermaidDiagramCardProps = {
  title?: string;
  mermaidCode: string;
};

let mermaidInitialized = false;

export function MermaidDiagramCard({ title, mermaidCode }: MermaidDiagramCardProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "neutral",
            securityLevel: "strict",
          });
          mermaidInitialized = true;
        }
        const renderId = `mmd-${reactId}-${Date.now()}`;
        const result = await mermaid.render(renderId, mermaidCode.trim());
        if (!cancelled) {
          setSvg(result.svg);
          setRenderError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setSvg(null);
          setRenderError(err instanceof Error ? err.message : "Invalid Mermaid diagram syntax.");
        }
      }
    }

    void renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [mermaidCode, reactId]);

  const zoomIn = () => setZoom((z) => Math.min(2, Number((z + 0.2).toFixed(2))));
  const zoomOut = () => setZoom((z) => Math.max(0.5, Number((z - 0.2).toFixed(2))));
  const resetZoom = () => setZoom(1);

  return (
    <Card className="overflow-hidden border-border">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/60 bg-muted/40 py-2.5">
        <CardTitle className="text-xs font-semibold">{title ?? "Visual Diagram"}</CardTitle>
        <div className="flex items-center gap-1">
          {!showSource && !renderError && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Zoom out"
                onClick={zoomOut}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="min-w-10 text-center text-[11px] font-mono text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Zoom in"
                onClick={zoomIn}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Reset zoom"
                onClick={resetZoom}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSource((v) => !v)}
          >
            {showSource ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                Diagram
              </>
            ) : (
              <>
                <Code2 className="h-3.5 w-3.5" />
                Source
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {renderError && (
          <div
            role="status"
            className="mb-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <div className="font-medium">Could not render diagram visually — showing raw source</div>
              <div className="mt-0.5 opacity-80">{renderError}</div>
            </div>
          </div>
        )}

        {showSource || renderError ? (
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs font-mono text-foreground">
            <code>{mermaidCode}</code>
          </pre>
        ) : svg ? (
          <div className="overflow-auto rounded-lg bg-background p-2">
            <div
              data-testid="mermaid-svg-container"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
              className="transition-transform"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-muted-foreground">Rendering diagram...</div>
        )}
      </CardContent>
    </Card>
  );
}
