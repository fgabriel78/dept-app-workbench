import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createWorkspaceFromTemplate, slugifyProjectName } from "../create";

describe("slugifyProjectName", () => {
  it("normalizes accents, spaces, and punctuation into valid hyphenated folder names", () => {
    expect(slugifyProjectName("Leave Request Tracker")).toBe("leave-request-tracker");
    expect(slugifyProjectName("  Gestió d'Incidències (v2)! ")).toBe("gestio-d-incidencies-v2");
    expect(slugifyProjectName("Año Nuevo 2026")).toBe("ano-nuevo-2026");
  });

  it("returns empty string when input has no alphanumeric characters", () => {
    expect(slugifyProjectName("!!! --- ___")).toBe("");
  });
});

describe("createWorkspaceFromTemplate", () => {
  let tempBase: string;
  let templateDir: string;
  let projectsRoot: string;

  beforeEach(() => {
    tempBase = fs.mkdtempSync(path.join(os.tmpdir(), "workbench-create-"));
    templateDir = path.join(tempBase, "template-repo");
    projectsRoot = path.join(tempBase, "projects");

    fs.mkdirSync(path.join(templateDir, ".agents"), { recursive: true });
    fs.writeFileSync(path.join(templateDir, ".agents", "workflow.md"), "# Workflow", "utf8");
    fs.writeFileSync(path.join(templateDir, "README.md"), "# Template Repo", "utf8");
    execFileSync("git", ["init"], { cwd: templateDir, windowsHide: true });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: templateDir,
      windowsHide: true,
    });
    execFileSync("git", ["config", "user.name", "Test User"], {
      cwd: templateDir,
      windowsHide: true,
    });
    execFileSync("git", ["add", "."], { cwd: templateDir, windowsHide: true });
    execFileSync("git", ["commit", "-m", "Initial template"], {
      cwd: templateDir,
      windowsHide: true,
    });
  });

  afterEach(() => {
    fs.rmSync(tempBase, { recursive: true, force: true });
  });

  it("clones template into slugified folder, re-initializes git, and returns workspace state", async () => {
    const result = await createWorkspaceFromTemplate({
      projectName: "My New App",
      templateRepoUrl: templateDir,
      projectsRootDir: projectsRoot,
      locale: "en",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.folderName).toBe("my-new-app");
    expect(result.state.projectName).toBe("my-new-app");
    expect(result.state.hasAgentsDir).toBe(true);

    const targetDir = path.join(projectsRoot, "my-new-app");
    expect(fs.existsSync(path.join(targetDir, "README.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, ".git"))).toBe(true);

    // Fresh git init has no origin remote pointing to the template repo
    const remotes = execFileSync("git", ["remote"], {
      cwd: targetDir,
      encoding: "utf8",
      windowsHide: true,
    }).trim();
    expect(remotes).toBe("");
  });

  it("rejects duplicate folder names with localized 409 error", async () => {
    fs.mkdirSync(path.join(projectsRoot, "existing-app"), { recursive: true });

    const result = await createWorkspaceFromTemplate({
      projectName: "Existing App",
      templateRepoUrl: templateDir,
      projectsRootDir: projectsRoot,
      locale: "es",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(result.error).toContain("existing-app");
  });

  it("cleans up target folder if template clone fails", async () => {
    const result = await createWorkspaceFromTemplate({
      projectName: "Broken Clone",
      templateRepoUrl: path.join(tempBase, "non-existent-repo"),
      projectsRootDir: projectsRoot,
      locale: "ca",
    });

    expect(result.ok).toBe(false);
    expect(fs.existsSync(path.join(projectsRoot, "broken-clone"))).toBe(false);
  });
});
