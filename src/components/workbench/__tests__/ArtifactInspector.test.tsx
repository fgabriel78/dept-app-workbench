import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceArtifacts } from "@/lib/types";
import { ArtifactInspector } from "../ArtifactInspector";

const initialArtifacts: WorkspaceArtifacts = {
  appBrief: "# Initial Brief",
  activeChangeName: "demo-change",
  proposal: "# Proposal v1",
  design: "# Design v1",
  tasks: "- [x] 1.1 Done\n- [ ] 1.2 Pending\n",
  taskProgress: { total: 2, completed: 1, remaining: 1 },
  specs: [{ name: "core", path: "specs/core/spec.md", content: "# Core Spec" }],
};

describe("ArtifactInspector", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders artifacts and task progress, and refreshes when refreshToken increments", async () => {
    const updatedArtifacts: WorkspaceArtifacts = {
      ...initialArtifacts,
      appBrief: "# Updated Brief After Agent Turn",
      taskProgress: { total: 2, completed: 2, remaining: 0 },
    };

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ artifacts: updatedArtifacts }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { rerender } = render(
      <ArtifactInspector
        projectRoot="C:\\Dev\\demo"
        artifacts={initialArtifacts}
        refreshToken={0}
      />,
    );

    expect(screen.getByText("Initial Brief")).toBeInTheDocument();
    expect(screen.getByText("1/2 (50%)")).toBeInTheDocument();

    rerender(
      <ArtifactInspector
        projectRoot="C:\\Dev\\demo"
        artifacts={initialArtifacts}
        refreshToken={1}
      />,
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/api/workspace/artifacts?path="),
      );
      expect(screen.getByText("Updated Brief After Agent Turn")).toBeInTheDocument();
      expect(screen.getByText("2/2 (100%)")).toBeInTheDocument();
    });
  });
});
