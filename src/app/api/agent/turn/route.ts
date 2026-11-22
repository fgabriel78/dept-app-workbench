import { NextResponse } from "next/server";
import { z } from "zod";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { STAGES } from "@/lib/types";
import { validateWorkspaceRoot } from "@/lib/workspace/state";
import { createAgentTurnStream } from "@/lib/agent/turn-runner";

export const runtime = "nodejs";

const turnRequestSchema = z.object({
  projectRoot: z.string().min(1),
  stage: z.enum(STAGES),
  locale: z.enum(SUPPORTED_LOCALES).default("en"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const parsed = turnRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid turn request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const validation = validateWorkspaceRoot(parsed.data.projectRoot, parsed.data.locale);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const stream = createAgentTurnStream({
    projectRoot: validation.rootPath,
    stage: parsed.data.stage,
    locale: parsed.data.locale,
    messages: parsed.data.messages,
    signal: request.signal,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
