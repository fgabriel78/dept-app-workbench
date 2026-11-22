import { NextResponse } from "next/server";
import { z } from "zod";
import { getDictionary, normalizeLocale, SUPPORTED_LOCALES } from "@/lib/i18n";
import {
  inspectWorkspaceState,
  readWorkspaceArtifacts,
  validateWorkspaceRoot,
} from "@/lib/workspace/state";

export const runtime = "nodejs";

const selectRequestSchema = z.object({
  path: z.string().min(1),
  locale: z.enum(SUPPORTED_LOCALES).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: getDictionary("en").validation.invalidJson }, { status: 400 });
  }

  const rawLocale =
    typeof body === "object" && body !== null && "locale" in body
      ? normalizeLocale(String((body as { locale?: unknown }).locale ?? ""))
      : null;
  const fallbackLocale = rawLocale ?? "en";

  const parsed = selectRequestSchema.safeParse(body);
  if (!parsed.success) {
    const dict = getDictionary(fallbackLocale);
    return NextResponse.json(
      { error: dict.validation.emptyPath },
      { status: 400 },
    );
  }

  const locale = parsed.data.locale ?? fallbackLocale;
  const validation = validateWorkspaceRoot(parsed.data.path, locale);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const state = inspectWorkspaceState(validation.rootPath, locale);
  const artifacts = readWorkspaceArtifacts(validation.rootPath);

  return NextResponse.json({ state, artifacts });
}
