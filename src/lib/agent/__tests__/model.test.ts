import { describe, expect, it } from "vitest";
import { patchGeminiFunctionCallBody } from "../model";

describe("patchGeminiFunctionCallBody", () => {
  it("adds skip_thought_signature_validator to functionCall parts missing a signature", () => {
    const input = JSON.stringify({
      contents: [
        { role: "user", parts: [{ text: "hello" }] },
        {
          role: "model",
          parts: [{ functionCall: { name: "list_dir", args: {} } }],
        },
      ],
    });

    const output = JSON.parse(patchGeminiFunctionCallBody(input));
    expect(output.contents[1].parts[0].thoughtSignature).toBe(
      "skip_thought_signature_validator",
    );
  });

  it("preserves existing thoughtSignature untouched", () => {
    const input = JSON.stringify({
      contents: [
        {
          role: "model",
          parts: [
            {
              functionCall: { name: "list_dir", args: {} },
              thoughtSignature: "real-sig-123",
            },
          ],
        },
      ],
    });

    expect(patchGeminiFunctionCallBody(input)).toBe(input);
  });

  it("injects low thinkingLevel for Gemini 3/4 models and low thinkingBudget for Gemini 2.5 models", () => {
    const input = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: "hello" }] }],
    });

    const g4 = JSON.parse(patchGeminiFunctionCallBody(input, "gemini-4-hydrogen"));
    expect(g4.generationConfig.thinkingConfig).toEqual({ thinkingLevel: "low" });

    const g25 = JSON.parse(patchGeminiFunctionCallBody(input, "gemini-2.5-flash"));
    expect(g25.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 1024 });
  });
});
