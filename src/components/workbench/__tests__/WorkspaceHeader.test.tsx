import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { WorkspaceState } from "@/lib/types";
import { I18nProvider } from "../I18nProvider";
import { WorkspaceHeader } from "../WorkspaceHeader";

const mockState: WorkspaceState = {
  rootPath: "C:\\Dev\\demo-app",
  projectName: "demo-app",
  hasAgentsDir: true,
  hasOpenspecDir: true,
  hasAppBrief: true,
  activeChanges: [],
  archivedChanges: [],
  phase: "brief-ready",
  recommendedStage: "explore",
  stages: [
    { id: "brief", label: "Brief", description: "Functional interview", status: "completed" },
    { id: "explore", label: "Explore", description: "Read-only alignment", status: "active" },
    { id: "propose", label: "Propose", description: "Specs & plan", status: "available" },
    { id: "apply", label: "Apply", description: "Implement tasks", status: "upcoming" },
    { id: "test", label: "Test", description: "Run & preview app", status: "upcoming" },
    { id: "archive", label: "Archive", description: "Finalize change", status: "upcoming" },
  ],
};

describe("WorkspaceHeader", () => {
  it("renders all 6 lifecycle stages and notifies when switching stages", async () => {
    const user = userEvent.setup();
    const onSelectStage = vi.fn();
    const onSelectWorkspace = vi.fn();

    render(
      <WorkspaceHeader
        workspaceState={mockState}
        activeStage="explore"
        onSelectWorkspace={onSelectWorkspace}
        onSelectStage={onSelectStage}
      />,
    );

    expect(screen.getByText("demo-app")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Explore/i })).toHaveAttribute("aria-current", "step");

    await user.click(screen.getByRole("button", { name: /Propose/i }));
    expect(onSelectStage).toHaveBeenCalledWith("propose");
  });

  it("submits workspace folder path and displays errors when provided", async () => {
    const user = userEvent.setup();
    const onSelectWorkspace = vi.fn();

    render(
      <WorkspaceHeader
        workspaceState={null}
        activeStage="brief"
        workspaceError="Folder does not exist."
        onSelectWorkspace={onSelectWorkspace}
        onSelectStage={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Folder does not exist.");

    const input = screen.getByLabelText(/Local project folder path/i);
    await user.type(input, "C:\\Dev\\my-app");
    await user.click(screen.getByRole("button", { name: /Open Project/i }));
    expect(onSelectWorkspace).toHaveBeenCalledWith("C:\\Dev\\my-app");
  });

  it("switches UI labels when selecting ES or CA in the header language switcher", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider initialLocale="en">
        <WorkspaceHeader
          workspaceState={mockState}
          activeStage="explore"
          onSelectWorkspace={vi.fn()}
          onSelectStage={vi.fn()}
        />
      </I18nProvider>,
    );

    await user.click(screen.getByRole("button", { name: "CA" }));
    expect(screen.getByRole("button", { name: "Obrir projecte" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Explorar/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ES" }));
    expect(screen.getByRole("button", { name: "Abrir proyecto" })).toBeInTheDocument();
  });

  it("switches to Create New mode and submits a new project name", async () => {
    const user = userEvent.setup();
    const onCreateWorkspace = vi.fn();
    render(
      <I18nProvider initialLocale="en">
        <WorkspaceHeader
          workspaceState={null}
          activeStage="brief"
          onSelectWorkspace={vi.fn()}
          onCreateWorkspace={onCreateWorkspace}
          onSelectStage={vi.fn()}
        />
      </I18nProvider>,
    );

    await user.click(screen.getByRole("tab", { name: /Create New/i }));
    const nameInput = screen.getByLabelText(/New project name/i);
    await user.type(nameInput, "Leave Tracker");
    await user.click(screen.getByRole("button", { name: /Create Project/i }));
    expect(onCreateWorkspace).toHaveBeenCalledWith("Leave Tracker");
  });
});
