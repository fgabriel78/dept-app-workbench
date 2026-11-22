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
});
