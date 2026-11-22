import { streamText, type CoreMessage, type LanguageModelV1 } from "ai";
import type { AgentSseEvent, ConversationMessage, StageId } from "@/lib/types";
import { buildStageTools } from "@/lib/tools/stage-tools";
import { buildWebAdapterPrompt } from "./prompt-builder";
import { createLanguageModel } from "./model";

export type RunAgentTurnOptions = {
  projectRoot: string;
  stage: StageId;
  messages: ConversationMessage[];
  model?: LanguageModelV1;
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

      try {
        const { systemPrompt } = buildWebAdapterPrompt(options.projectRoot, options.stage);
        const tools = buildStageTools({
          projectRoot: options.projectRoot,
          stage: options.stage,
          onActivity: (activity) => emit({ type: "tool_activity", activity }),
          onQuestionGroup: (payload) => emit({ type: "question_group", payload }),
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

        const result = streamText({
          model,
          system: systemPrompt,
          messages: coreMessages,
          tools,
          maxSteps: 8,
          abortSignal: options.signal,
        });

        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            emit({ type: "text_delta", delta: part.textDelta });
          } else if (part.type === "error") {
            const msg = part.error instanceof Error ? part.error.message : String(part.error);
            emit({ type: "error", message: msg });
          }
        }

        emit({ type: "done" });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unexpected agent error";
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
