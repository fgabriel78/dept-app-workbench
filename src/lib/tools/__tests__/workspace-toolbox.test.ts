import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PathConfinementError, WorkspaceToolbox } from "../workspace-toolbox";

describe("WorkspaceToolbox", () => {
  let tempRoot: string;
  let outsideFile: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workbench-toolbox-"));
    fs.writeFileSync(path.join(tempRoot, "README.md"), "# Hello\nLine two\n", "utf8");
    outsideFile = path.join(path.dirname(tempRoot), `outside-${Date.now()}.txt`);
    fs.writeFileSync(outsideFile, "secret", "utf8");
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    if (fs.existsSync(outsideFile)) {
      fs.rmSync(outsideFile, { force: true });
    }
  });

  it("reads, writes, edits, and lists files strictly inside projectRoot", () => {
    const artifacts: string[] = [];
    const toolbox = new WorkspaceToolbox({
      projectRoot: tempRoot,
      onArtifactWritten: (p) => artifacts.push(p),
    });

    const readRes = toolbox.readFile("README.md");
    expect(readRes.content).toContain("# Hello");

    const writeRes = toolbox.writeFile("app-brief.md", "# Brief\nStatus: Draft");
    expect(writeRes.path).toBe("app-brief.md");
    expect(artifacts).toContain("app-brief.md");

    const editRes = toolbox.editFile("app-brief.md", "Status: Draft", "Status: Complete");
    expect(editRes.replacements).toBe(1);
    expect(toolbox.readFile("app-brief.md").content).toContain("Status: Complete");

    const dirRes = toolbox.listDir(".");
    expect(dirRes.entries.map((e) => e.name)).toEqual(["app-brief.md", "README.md"]);
  });

  it("rejects relative path traversal outside projectRoot", () => {
    const toolbox = new WorkspaceToolbox({ projectRoot: tempRoot });

    expect(() => toolbox.readFile("../outside.txt")).toThrow(PathConfinementError);
    expect(() => toolbox.writeFile("../../evil.txt", "nope")).toThrow(PathConfinementError);
    expect(() => toolbox.editFile("../outside.txt", "a", "b")).toThrow(PathConfinementError);
    expect(() => toolbox.listDir("..")).toThrow(PathConfinementError);
  });

  it("rejects absolute paths outside projectRoot", () => {
    const toolbox = new WorkspaceToolbox({ projectRoot: tempRoot });

    expect(() => toolbox.readFile(outsideFile)).toThrow(PathConfinementError);
    expect(() => toolbox.writeFile(outsideFile, "overwrite")).toThrow(PathConfinementError);
  });

  it("executes commands with cwd set to projectRoot", async () => {
    const toolbox = new WorkspaceToolbox({ projectRoot: tempRoot });
    const result = await toolbox.runCommand("node -e \"console.log(process.cwd())\"");
    expect(result.exitCode).toBe(0);
    expect(path.resolve(result.stdout.trim()).toLowerCase()).toBe(
      path.resolve(tempRoot).toLowerCase(),
    );
  });
});
