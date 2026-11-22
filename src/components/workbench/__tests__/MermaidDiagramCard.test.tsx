import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MermaidDiagramCard } from "../MermaidDiagramCard";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async (_id: string, code: string) => {
      if (code.includes("INVALID")) {
        throw new Error("Syntax error in text");
      }
      return { svg: "<svg data-testid=\"rendered-svg\"><text>Flow</text></svg>" };
    }),
  },
}));

describe("MermaidDiagramCard", () => {
  it("renders valid Mermaid SVG with zoom controls and source toggle", async () => {
    const user = userEvent.setup();
    render(
      <MermaidDiagramCard
        title="Approval Flow"
        mermaidCode={"flowchart LR\n  A[Draft] --> B[Approved]"}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("rendered-svg")).toBeInTheDocument();
    });

    expect(screen.getByText("100%")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Zoom in"));
    expect(screen.getByText("120%")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Reset zoom"));
    expect(screen.getByText("100%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Source/i }));
    expect(screen.getByText(/flowchart LR/)).toBeInTheDocument();
  });

  it("falls back to raw source with a non-blocking warning on invalid Mermaid syntax", async () => {
    render(<MermaidDiagramCard title="Broken" mermaidCode="INVALID %%% SYNTAX" />);

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        /Could not render diagram visually/i,
      );
    });
    expect(screen.getByText("INVALID %%% SYNTAX")).toBeInTheDocument();
  });
});
