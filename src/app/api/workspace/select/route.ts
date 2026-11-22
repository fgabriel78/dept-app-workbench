import { NextResponse } from "next/server";
import { z } from "zod";
import {
  inspectWorkspaceState,
  readWorkspaceArtifacts,
  validateWorkspaceRoot,
} from "@/lib/workspace/state";

export const runtime = "nodejs";

const selectRequestSchema = z.object({
  path: z.string().min(1, "Please provide a local project folder path."),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = selectRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid folder path." },
      { status: 400 },
    );
  }

  const validation = validateWorkspaceRoot(parsed.data.path);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const state = inspectWorkspaceState(validation.rootPath);
  const artifacts = readWorkspaceArtifacts(validation.rootPath);

  return NextResponse.json({ state, artifacts });
}
