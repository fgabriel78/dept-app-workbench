import { NextResponse } from "next/server";
import {
  inspectWorkspaceState,
  readWorkspaceArtifacts,
  validateWorkspaceRoot,
} from "@/lib/workspace/state";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rootPath = searchParams.get("path") ?? "";
  const changeName = searchParams.get("change") ?? undefined;

  const validation = validateWorkspaceRoot(rootPath);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const state = inspectWorkspaceState(validation.rootPath);
  const artifacts = readWorkspaceArtifacts(validation.rootPath, changeName);

  return NextResponse.json({ state, artifacts });
}
