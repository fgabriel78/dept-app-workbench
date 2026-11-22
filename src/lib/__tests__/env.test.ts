import { describe, it, expect } from "vitest";
import { parseEnv } from "../env";

describe("parseEnv", () => {
  it("parses valid openai configuration with default model", () => {
    const result = parseEnv({
      LLM_PROVIDER: "openai",
      OPENAI_API_KEY: "sk-test-123",
    });
    expect(result).toEqual({
      provider: "openai",
      model: "gpt-4o",
      apiKey: "sk-test-123",
      defaultWorkspacePath: undefined,
    });
  });

  it("parses valid anthropic configuration with custom model", () => {
    const result = parseEnv({
      LLM_PROVIDER: "anthropic",
      LLM_MODEL: "claude-3-7-sonnet-latest",
      ANTHROPIC_API_KEY: "sk-ant-123",
      DEFAULT_WORKSPACE_PATH: "C:/projects/demo",
    });
    expect(result).toEqual({
      provider: "anthropic",
      model: "claude-3-7-sonnet-latest",
      apiKey: "sk-ant-123",
      defaultWorkspacePath: "C:/projects/demo",
    });
  });

  it("parses valid google configuration", () => {
    const result = parseEnv({
      LLM_PROVIDER: "google",
      GOOGLE_GENERATIVE_AI_API_KEY: "AIza-test",
    });
    expect(result.provider).toBe("google");
    expect(result.model).toBe("gemini-2.5-flash");
    expect(result.apiKey).toBe("AIza-test");
  });

  it("throws when required API key for selected provider is missing", () => {
    expect(() =>
      parseEnv({
        LLM_PROVIDER: "openai",
      }),
    ).toThrow(/OPENAI_API_KEY/);

    expect(() =>
      parseEnv({
        LLM_PROVIDER: "anthropic",
        OPENAI_API_KEY: "sk-wrong-provider",
      }),
    ).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("throws on unsupported provider", () => {
    expect(() =>
      parseEnv({
        LLM_PROVIDER: "unknown-provider",
        OPENAI_API_KEY: "sk-test",
      }),
    ).toThrow();
  });
});
