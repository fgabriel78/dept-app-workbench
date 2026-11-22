import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";
import { parseEnv } from "@/lib/env";

const SKIP_THOUGHT_SIGNATURE = "skip_thought_signature_validator";

export function getDefaultGeminiThinkingConfig(
  modelId?: string,
): Record<string, unknown> | undefined {
  if (!modelId) return undefined;
  const normalized = modelId.toLowerCase();
  if (/^gemini-[34]/.test(normalized)) {
    return { thinkingLevel: "low" };
  }
  if (/^gemini-2\.5/.test(normalized)) {
    return { thinkingBudget: 1024 };
  }
  return undefined;
}

export function patchGeminiFunctionCallBody(body: string, modelId?: string): string {
  try {
    const payload = JSON.parse(body) as {
      contents?: Array<{
        parts?: Array<Record<string, unknown>>;
      }>;
      generationConfig?: Record<string, unknown>;
    };

    let modified = false;

    if (Array.isArray(payload.contents)) {
      for (const content of payload.contents) {
        if (!Array.isArray(content.parts)) continue;
        for (const part of content.parts) {
          if (
            part &&
            typeof part === "object" &&
            "functionCall" in part &&
            !("thoughtSignature" in part) &&
            !("thought_signature" in part)
          ) {
            part.thoughtSignature = SKIP_THOUGHT_SIGNATURE;
            modified = true;
          }
        }
      }
    }

    const thinkingConfig = getDefaultGeminiThinkingConfig(modelId);
    if (thinkingConfig) {
      const genConfig = payload.generationConfig ?? {};
      if (!("thinkingConfig" in genConfig) && !("thinking_config" in genConfig)) {
        payload.generationConfig = {
          ...genConfig,
          thinkingConfig,
        };
        modified = true;
      }
    }

    return modified ? JSON.stringify(payload) : body;
  } catch {
    return body;
  }
}

export function createGoogleFetchWithThoughtSignatureFallback(
  modelId?: string,
  baseFetch: typeof fetch = fetch,
): typeof fetch {
  return async (input, init) => {
    if (init && typeof init.body === "string") {
      return baseFetch(input, {
        ...init,
        body: patchGeminiFunctionCallBody(init.body, modelId),
      });
    }
    return baseFetch(input, init);
  };
}

export function createLanguageModel(): LanguageModelV1 {
  const env = parseEnv();

  if (env.provider === "openai") {
    const openai = createOpenAI({ apiKey: env.apiKey });
    return openai(env.model);
  }

  if (env.provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey: env.apiKey });
    return anthropic(env.model);
  }

  const google = createGoogleGenerativeAI({
    apiKey: env.apiKey,
    fetch: createGoogleFetchWithThoughtSignatureFallback(env.model),
  });
  return google(env.model);
}
