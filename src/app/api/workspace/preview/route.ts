import { NextResponse } from "next/server";
import { z } from "zod";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import {
  getWorkspacePreviewStatus,
  startWorkspacePreview,
  stopWorkspacePreview,
} from "@/lib/workspace/preview-manager";
import { validateWorkspaceRoot } from "@/lib/workspace/state";

export const runtime = "nodejs";

const startRequestSchema = z.object({
  projectRoot: z.string().min(1),
  locale: z.enum(SUPPORTED_LOCALES).default("en"),
});

export async function GET() {
  return NextResponse.json({ preview: getWorkspacePreviewStatus() });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const parsed = startRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid preview request." }, { status: 400 });
  }

  const validation = validateWorkspaceRoot(parsed.data.projectRoot, parsed.data.locale);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const preview = await startWorkspacePreview(validation.rootPath);
  const status = preview.status === "error" ? 500 : 200;
  return NextResponse.json({ preview }, { status });
}

export async function DELETE() {
  const preview = await stopWorkspacePreview();
  return NextResponse.json({ preview });
}
