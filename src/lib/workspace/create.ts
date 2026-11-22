import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { parseWorkspaceEnv } from "@/lib/env";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { WorkspaceArtifacts, WorkspaceState } from "@/lib/types";
import { inspectWorkspaceState, readWorkspaceArtifacts, validateWorkspaceRoot } from "./state";

const execFileAsync = promisify(execFile);

export function slugifyProjectName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type CreateWorkspaceOptions = {
  projectName: string;
  locale?: Locale;
  templateRepoUrl?: string;
  projectsRootDir?: string;
};

export type CreateWorkspaceResult =
  | { ok: true; state: WorkspaceState; artifacts: WorkspaceArtifacts; folderName: string }
  | { ok: false; status: number; error: string };

export async function createWorkspaceFromTemplate(
  options: CreateWorkspaceOptions,
): Promise<CreateWorkspaceResult> {
  const locale = options.locale ?? "en";
  const { validation: v } = getDictionary(locale);

  const trimmed = options.projectName.trim();
  if (!trimmed) {
    return { ok: false, status: 400, error: v.emptyProjectName };
  }

  const slug = slugifyProjectName(trimmed);
  if (!slug) {
    return { ok: false, status: 400, error: v.invalidProjectName };
  }

  const env = parseWorkspaceEnv();
  const rootDir = options.projectsRootDir
    ? path.resolve(options.projectsRootDir)
    : env.projectsRootDir;
  const templateUrl = options.templateRepoUrl ?? env.templateRepoUrl;
  const targetDir = path.join(rootDir, slug);

  if (fs.existsSync(targetDir)) {
    return { ok: false, status: 409, error: v.projectAlreadyExists(slug) };
  }

  fs.mkdirSync(rootDir, { recursive: true });

  let createdTarget = false;
  try {
    await execFileAsync("git", ["clone", "--depth", "1", templateUrl, targetDir], {
      windowsHide: true,
      timeout: 120_000,
    });
    createdTarget = true;

    const gitDir = path.join(targetDir, ".git");
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { recursive: true, force: true, maxRetries: 3 });
    }

    await execFileAsync("git", ["init"], {
      cwd: targetDir,
      windowsHide: true,
      timeout: 30_000,
    });
  } catch (err: unknown) {
    if (createdTarget || fs.existsSync(targetDir)) {
      try {
        fs.rmSync(targetDir, { recursive: true, force: true, maxRetries: 3 });
      } catch {
        // ignore cleanup error
      }
    }
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 500, error: v.cloneFailed(detail) };
  }

  const validation = validateWorkspaceRoot(targetDir, locale);
  if (!validation.valid) {
    return { ok: false, status: 400, error: validation.error };
  }

  const state = inspectWorkspaceState(validation.rootPath, locale);
  const artifacts = readWorkspaceArtifacts(validation.rootPath);

  return {
    ok: true,
    state,
    artifacts,
    folderName: slug,
  };
}
