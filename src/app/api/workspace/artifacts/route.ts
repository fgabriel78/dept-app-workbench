import { NextResponse } from "next/server";
import { normalizeLocale } from "@/lib/i18n";
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
  const locale = normalizeLocale(searchParams.get("locale")) ?? "en";

  const validation = validateWorkspaceRoot(rootPath, locale);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const state = inspectWorkspaceState(validation.rootPath, locale);
  const artifacts = readWorkspaceArtifacts(validation.rootPath, changeName);

  return NextResponse.json({ state, artifacts });
}
