import { streamText, type CoreMessage, type LanguageModelV1 } from "ai";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { AgentSseEvent, ConversationMessage, QuestionGroupPayload, StageId } from "@/lib/types";
import { buildStageTools } from "@/lib/tools/stage-tools";
import { buildWebAdapterPrompt } from "./prompt-builder";
import { createLanguageModel } from "./model";

export type RunAgentTurnOptions = {
  projectRoot: string;
  stage: StageId;
  messages: ConversationMessage[];
  locale?: Locale;
  model?: LanguageModelV1;
  maxSteps?: number;
  signal?: AbortSignal;
};

export function formatSseEvent(event: AgentSseEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export function createAgentTurnStream(options: RunAgentTurnOptions): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: AgentSseEvent) => {
        try {
          controller.enqueue(encoder.encode(formatSseEvent(event)));
        } catch {
          // Stream already closed by client
        }
      };

      const writtenArtifacts = new Set<string>();

      const locale = options.locale ?? "en";
      const dict = getDictionary(locale);

      try {
        const { systemPrompt } = buildWebAdapterPrompt(options.projectRoot, options.stage, locale);
        const tools = buildStageTools({
          projectRoot: options.projectRoot,
          stage: options.stage,
          locale,
          onActivity: (activity) => emit({ type: "tool_activity", activity }),
          onDiagram: (payload) => emit({ type: "diagram", payload }),
          onArtifactWritten: (relPath) => {
            writtenArtifacts.add(relPath);
            emit({ type: "artifact_updated", paths: Array.from(writtenArtifacts) });
          },
        });

        const model = options.model ?? createLanguageModel();
        const coreMessages: CoreMessage[] = options.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const defaultMaxSteps =
          options.stage === "apply"
            ? 100
            : options.stage === "propose" || options.stage === "test"
              ? 40
              : 20;
        const maxSteps = options.maxSteps ?? defaultMaxSteps;

        const result = streamText({
          model,
          system: systemPrompt,
          messages: coreMessages,
          tools,
          maxSteps,
          abortSignal: options.signal,
        });

        let askedQuestions = false;
        let emittedAnyText = false;
        let emittedTextSinceToolCall = false;
        let lastFinishReason: string | undefined;

        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            emittedAnyText = true;
            emittedTextSinceToolCall = true;
            emit({ type: "text_delta", delta: part.textDelta });
          } else if (part.type === "tool-call") {
            emittedTextSinceToolCall = false;
            if (process.env.NODE_ENV !== "test") {
              console.info(`[agent/turn] tool-call: ${part.toolName} (${part.toolCallId})`);
            }
            if (part.toolName === "ask_questions") {
              askedQuestions = true;
              const input = part.args as Omit<QuestionGroupPayload, "id">;
              emit({
                type: "question_group",
                payload: {
                  id: `qgroup-${Date.now()}-${part.toolCallId}`,
                  title: input.title,
                  description: input.description,
                  questions: input.questions,
                },
              });
            }
          } else if (part.type === "finish") {
            lastFinishReason = part.finishReason;
          } else if (part.type === "error") {
            const msg = part.error instanceof Error ? part.error.message : String(part.error);
            console.error("[agent/turn] stream error:", part.error);
            emit({ type: "error", message: msg });
          }
        }

        if (!askedQuestions && lastFinishReason === "tool-calls" && !emittedTextSinceToolCall) {
          emit({
            type: "text_delta",
            delta: `${emittedAnyText ? "\n\n" : ""}${dict.workbench.stepLimitReached}`,
          });
        }

        emit({ type: "done" });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : dict.workbench.defaultAgentError;
        emit({ type: "error", message });
        emit({ type: "done" });
      } finally {
        try {
          controller.close();
        } catch {
          // ignore
        }
      }
    },
  });
}
