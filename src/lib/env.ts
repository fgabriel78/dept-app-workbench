import path from "path";
import { z } from "zod";

export const DEFAULT_TEMPLATE_REPO_URL = "https://github.com/fgabriel78/dept-app-brief.git";

export const LLM_PROVIDERS = ["openai", "anthropic", "google"] as const;
export type LlmProvider = (typeof LLM_PROVIDERS)[number];

export const DEFAULT_MODELS: Record<LlmProvider, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-20250514",
  google: "gemini-2.5-flash",
};

const envSchema = z
  .object({
    LLM_PROVIDER: z.enum(LLM_PROVIDERS).default("openai"),
    LLM_MODEL: z.string().trim().min(1).optional(),
    OPENAI_API_KEY: z.string().trim().optional(),
    ANTHROPIC_API_KEY: z.string().trim().optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().trim().optional(),
    DEFAULT_WORKSPACE_PATH: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.LLM_PROVIDER === "openai" && !data.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["OPENAI_API_KEY"],
        message: "OPENAI_API_KEY is required when LLM_PROVIDER is 'openai'.",
      });
    }
    if (data.LLM_PROVIDER === "anthropic" && !data.ANTHROPIC_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ANTHROPIC_API_KEY"],
        message: "ANTHROPIC_API_KEY is required when LLM_PROVIDER is 'anthropic'.",
      });
    }
    if (data.LLM_PROVIDER === "google" && !data.GOOGLE_GENERATIVE_AI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GOOGLE_GENERATIVE_AI_API_KEY"],
        message: "GOOGLE_GENERATIVE_AI_API_KEY is required when LLM_PROVIDER is 'google'.",
      });
    }
  });

export type ValidatedEnv = {
  provider: LlmProvider;
  model: string;
  apiKey: string;
  defaultWorkspacePath?: string;
};

export function parseEnv(raw: Record<string, string | undefined> = process.env): ValidatedEnv {
  const parsed = envSchema.parse({
    LLM_PROVIDER: raw.LLM_PROVIDER || undefined,
    LLM_MODEL: raw.LLM_MODEL || undefined,
    OPENAI_API_KEY: raw.OPENAI_API_KEY || undefined,
    ANTHROPIC_API_KEY: raw.ANTHROPIC_API_KEY || undefined,
    GOOGLE_GENERATIVE_AI_API_KEY: raw.GOOGLE_GENERATIVE_AI_API_KEY || undefined,
    DEFAULT_WORKSPACE_PATH: raw.DEFAULT_WORKSPACE_PATH || undefined,
  });

  const apiKey =
    parsed.LLM_PROVIDER === "openai"
      ? parsed.OPENAI_API_KEY!
      : parsed.LLM_PROVIDER === "anthropic"
        ? parsed.ANTHROPIC_API_KEY!
        : parsed.GOOGLE_GENERATIVE_AI_API_KEY!;

  return {
    provider: parsed.LLM_PROVIDER,
    model: parsed.LLM_MODEL ?? DEFAULT_MODELS[parsed.LLM_PROVIDER],
    apiKey,
    defaultWorkspacePath: parsed.DEFAULT_WORKSPACE_PATH || undefined,
  };
}

export type WorkspaceEnv = {
  templateRepoUrl: string;
  projectsRootDir: string;
};

const workspaceEnvSchema = z.object({
  TEMPLATE_REPO_URL: z.string().trim().min(1).optional(),
  PROJECTS_ROOT_DIR: z.string().trim().min(1).optional(),
});

export function parseWorkspaceEnv(
  raw: Record<string, string | undefined> = process.env,
): WorkspaceEnv {
  const parsed = workspaceEnvSchema.parse({
    TEMPLATE_REPO_URL: raw.TEMPLATE_REPO_URL || undefined,
    PROJECTS_ROOT_DIR: raw.PROJECTS_ROOT_DIR || undefined,
  });

  return {
    templateRepoUrl: parsed.TEMPLATE_REPO_URL ?? DEFAULT_TEMPLATE_REPO_URL,
    projectsRootDir: parsed.PROJECTS_ROOT_DIR
      ? path.resolve(parsed.PROJECTS_ROOT_DIR)
      : path.resolve(process.cwd(), ".."),
  };
}
