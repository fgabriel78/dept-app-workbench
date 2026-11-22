import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { QuestionGroupPayload } from "@/lib/types";
import { QuestionGroupCard } from "../QuestionGroupCard";

const samplePayload: QuestionGroupPayload = {
  id: "qg-1",
  title: "Project Scope Questions",
  questions: [
    { id: "q1", prompt: "What is the app name?", type: "text", placeholder: "e.g. Budget Tracker" },
    {
      id: "q2",
      prompt: "Primary user group?",
      type: "single_choice",
      options: ["Finance", "Operations"],
    },
    {
      id: "q3",
      prompt: "Needed exports?",
      type: "multi_choice",
      options: ["CSV", "PDF"],
    },
    { id: "q4", prompt: "Needs approval workflow?", type: "confirm" },
  ],
};

describe("QuestionGroupCard", () => {
  it("renders all 4 input types and submits structured answers once complete", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<QuestionGroupCard payload={samplePayload} onSubmit={onSubmit} />);

    const submitBtn = screen.getByRole("button", { name: /Submit Answers/i });
    expect(submitBtn).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/Budget Tracker/i), "Expense Hub");
    await user.click(screen.getByRole("radio", { name: "Finance" }));
    await user.click(screen.getByRole("checkbox", { name: "CSV" }));
    await user.click(screen.getByRole("checkbox", { name: "PDF" }));
    await user.click(screen.getByRole("button", { name: "Yes" }));

    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledWith({
      q1: "Expense Hub",
      q2: "Finance",
      q3: ["CSV", "PDF"],
      q4: true,
    });
  });

  it("renders as a read-only summary once submittedAnswers is provided", () => {
    render(
      <QuestionGroupCard
        payload={samplePayload}
        submittedAnswers={{
          q1: "Expense Hub",
          q2: "Finance",
          q3: ["CSV"],
          q4: false,
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.getByText("Expense Hub")).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByText("CSV")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Submit Answers/i })).not.toBeInTheDocument();
  });
});
