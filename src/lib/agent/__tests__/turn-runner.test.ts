import fs from "fs";
import os from "os";
import path from "path";
import { MockLanguageModelV1, simulateReadableStream } from "ai/test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AgentSseEvent } from "@/lib/types";
import { createAgentTurnStream } from "../turn-runner";

async function collectSseEvents(stream: ReadableStream<Uint8Array>): Promise<AgentSseEvent[]> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const events: AgentSseEvent[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const dataLine = chunk
        .split("\n")
        .find((line) => line.startsWith("data: "));
      if (dataLine) {
        events.push(JSON.parse(dataLine.slice(6)) as AgentSseEvent);
      }
    }
  }
  return events;
}

describe("createAgentTurnStream SSE integration", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workbench-turn-"));
    fs.mkdirSync(path.join(tempRoot, ".agents"), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, "README.md"), "# Demo", "utf8");
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("streams tool_activity, artifact_updated, diagram, question_group, text_delta, and stops turn after ask_questions", async () => {
    let callIndex = 0;

    const mockModel = new MockLanguageModelV1({
      doStream: async () => {
        callIndex += 1;
        if (callIndex === 1) {
          return {
            stream: simulateReadableStream({
              chunks: [
                {
                  type: "tool-call",
                  toolCallType: "function",
                  toolCallId: "tc-1",
                  toolName: "write_file",
                  args: JSON.stringify({
                    path: "app-brief.md",
                    content: "# App Brief\nDraft content",
                  }),
                },
                {
                  type: "tool-call",
                  toolCallType: "function",
                  toolCallId: "tc-2",
                  toolName: "render_diagram",
                  args: JSON.stringify({
                    title: "Workflow",
                    mermaid: "flowchart LR\n  A[Start] --> B[End]",
                  }),
                },
                { type: "text-delta", textDelta: "I drafted the brief " },
                { type: "text-delta", textDelta: "and added a question card." },
                {
                  type: "tool-call",
                  toolCallType: "function",
                  toolCallId: "tc-3",
                  toolName: "ask_questions",
                  args: JSON.stringify({
                    title: "Confirm Scope",
                    questions: [
                      {
                        id: "q1",
                        prompt: "Who are the primary users?",
                        type: "text",
                      },
                    ],
                  }),
                },
                {
                  type: "finish",
                  finishReason: "tool-calls",
                  usage: { promptTokens: 10, completionTokens: 20 },
                },
              ],
            }),
            rawCall: { rawPrompt: null, rawSettings: {} },
          };
        }

        return {
          stream: simulateReadableStream({
            chunks: [
              { type: "text-delta", textDelta: "Unexpected post-question text." },
              {
                type: "finish",
                finishReason: "stop",
                usage: { promptTokens: 15, completionTokens: 10 },
              },
            ],
          }),
          rawCall: { rawPrompt: null, rawSettings: {} },
        };
      },
    });

    const stream = createAgentTurnStream({
      projectRoot: tempRoot,
      stage: "brief",
      messages: [{ role: "user", content: "Start the brief interview." }],
      model: mockModel,
    });

    const events = await collectSseEvents(stream);
    const types = events.map((e) => e.type);

    expect(callIndex).toBe(1);
    expect(types).toContain("tool_activity");
    expect(types).toContain("artifact_updated");
    expect(types).toContain("diagram");
    expect(types).toContain("question_group");
    expect(types).toContain("text_delta");
    expect(types[types.length - 1]).toBe("done");

    const text = events
      .filter((e): e is Extract<AgentSseEvent, { type: "text_delta" }> => e.type === "text_delta")
      .map((e) => e.delta)
      .join("");
    expect(text).toBe("I drafted the brief and added a question card.");

    expect(fs.readFileSync(path.join(tempRoot, "app-brief.md"), "utf8")).toContain("Draft content");
  });

  it("emits a localized step-limit notice when maxSteps ends on tool-calls without closing text", async () => {
    const mockModel = new MockLanguageModelV1({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            {
              type: "tool-call",
              toolCallType: "function",
              toolCallId: "tc-only",
              toolName: "list_dir",
              args: JSON.stringify({ path: "." }),
            },
            {
              type: "finish",
              finishReason: "tool-calls",
              usage: { promptTokens: 10, completionTokens: 10 },
            },
          ],
        }),
        rawCall: { rawPrompt: null, rawSettings: {} },
      }),
    });

    const stream = createAgentTurnStream({
      projectRoot: tempRoot,
      stage: "propose",
      locale: "es",
      maxSteps: 1,
      messages: [{ role: "user", content: "Propose change" }],
      model: mockModel,
    });

    const events = await collectSseEvents(stream);
    const text = events
      .filter((e): e is Extract<AgentSseEvent, { type: "text_delta" }> => e.type === "text_delta")
      .map((e) => e.delta)
      .join("");

    expect(text).toContain("breve pausa");
    expect(events[events.length - 1]?.type).toBe("done");
  });
});
