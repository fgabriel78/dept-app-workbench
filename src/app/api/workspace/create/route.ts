import { NextResponse } from "next/server";
import { z } from "zod";
import { getDictionary, normalizeLocale, SUPPORTED_LOCALES } from "@/lib/i18n";
import { createWorkspaceFromTemplate } from "@/lib/workspace/create";

export const runtime = "nodejs";

const createRequestSchema = z.object({
  projectName: z.string().min(1),
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

  const parsed = createRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: getDictionary(fallbackLocale).validation.emptyProjectName },
      { status: 400 },
    );
  }

  const locale = parsed.data.locale ?? fallbackLocale;
  const result = await createWorkspaceFromTemplate({
    projectName: parsed.data.projectName,
    locale,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    state: result.state,
    artifacts: result.artifacts,
    folderName: result.folderName,
  });
}
