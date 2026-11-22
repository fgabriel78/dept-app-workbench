"use client";

import React, { useState } from "react";
import { CheckCircle2, HelpCircle, Send } from "lucide-react";
import type { QuestionGroupPayload, QuestionItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export type QuestionAnswerValue = string | string[] | boolean;
export type QuestionAnswersMap = Record<string, QuestionAnswerValue>;

export type QuestionGroupCardProps = {
  payload: QuestionGroupPayload;
  submittedAnswers?: QuestionAnswersMap;
  disabled?: boolean;
  onSubmit: (answers: QuestionAnswersMap) => void;
};

function formatAnswerSummary(question: QuestionItem, value: QuestionAnswerValue | undefined): string {
  if (value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
  return value;
}

function isQuestionAnswered(question: QuestionItem, value: QuestionAnswerValue | undefined): boolean {
  if (question.required === false) return true;
  if (question.type === "confirm") return typeof value === "boolean";
  if (question.type === "multi_choice") return Array.isArray(value) && value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
}

export function QuestionGroupCard({
  payload,
  submittedAnswers,
  disabled = false,
  onSubmit,
}: QuestionGroupCardProps) {
  const [answers, setAnswers] = useState<QuestionAnswersMap>({});
  const isSubmitted = Boolean(submittedAnswers);

  const setAnswer = (id: string, value: QuestionAnswerValue) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const toggleMultiChoice = (id: string, option: string) => {
    setAnswers((prev) => {
      const existing = Array.isArray(prev[id]) ? (prev[id] as string[]) : [];
      const next = existing.includes(option)
        ? existing.filter((o) => o !== option)
        : [...existing, option];
      return { ...prev, [id]: next };
    });
  };

  const canSubmit =
    !isSubmitted &&
    !disabled &&
    payload.questions.every((q) => isQuestionAnswered(q, answers[q.id]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(answers);
  };

  if (isSubmitted && submittedAnswers) {
    return (
      <Card className="border-emerald-200/80 bg-emerald-50/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <CardTitle>{payload.title ?? "Questions Answered"}</CardTitle>
            </div>
            <Badge variant="success">Submitted</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {payload.questions.map((q) => (
            <div key={q.id} className="rounded-lg border border-emerald-200/60 bg-background/80 p-2.5">
              <div className="text-xs font-medium text-muted-foreground">{q.prompt}</div>
              <div className="mt-1 text-sm font-medium text-foreground">
                {formatAnswerSummary(q, submittedAnswers[q.id])}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-card shadow-sm">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            <CardTitle>{payload.title ?? "Please share a few details"}</CardTitle>
          </div>
          {payload.description && <CardDescription>{payload.description}</CardDescription>}
        </CardHeader>

        <CardContent className="space-y-5">
          {payload.questions.map((question, idx) => {
            const val = answers[question.id];
            return (
              <div key={question.id} className="space-y-2">
                <label
                  htmlFor={`q-${payload.id}-${question.id}`}
                  className="block text-sm font-medium text-foreground"
                >
                  <span className="mr-1.5 text-xs font-semibold text-primary">{idx + 1}.</span>
                  {question.prompt}
                </label>

                {question.type === "text" && (
                  <Textarea
                    id={`q-${payload.id}-${question.id}`}
                    placeholder={question.placeholder ?? "Type your answer..."}
                    value={typeof val === "string" ? val : ""}
                    onChange={(e) => setAnswer(question.id, e.target.value)}
                    disabled={disabled}
                  />
                )}

                {question.type === "single_choice" && (
                  <div role="radiogroup" aria-label={question.prompt} className="grid gap-2 sm:grid-cols-2">
                    {(question.options ?? []).map((option) => {
                      const selected = val === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={disabled}
                          onClick={() => setAnswer(question.id, option)}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-left text-sm transition-all cursor-pointer",
                            selected
                              ? "border-primary bg-primary/10 font-medium text-primary"
                              : "border-border bg-background hover:bg-accent",
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}

                {question.type === "multi_choice" && (
                  <div role="group" aria-label={question.prompt} className="grid gap-2 sm:grid-cols-2">
                    {(question.options ?? []).map((option) => {
                      const list = Array.isArray(val) ? val : [];
                      const checked = list.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          disabled={disabled}
                          onClick={() => toggleMultiChoice(question.id, option)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all cursor-pointer",
                            checked
                              ? "border-primary bg-primary/10 font-medium text-primary"
                              : "border-border bg-background hover:bg-accent",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
                              checked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/40",
                            )}
                          >
                            {checked ? "✓" : ""}
                          </span>
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {question.type === "confirm" && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={val === true ? "default" : "outline"}
                      aria-pressed={val === true}
                      disabled={disabled}
                      onClick={() => setAnswer(question.id, true)}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={val === false ? "default" : "outline"}
                      aria-pressed={val === false}
                      disabled={disabled}
                      onClick={() => setAnswer(question.id, false)}
                    >
                      No
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>

        <CardFooter className="justify-end border-t border-border/60 pt-3">
          <Button type="submit" disabled={!canSubmit}>
            <Send className="h-3.5 w-3.5" />
            Submit Answers
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
