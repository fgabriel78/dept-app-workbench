import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  inspectWorkspaceState,
  parseTaskProgress,
  readWorkspaceArtifacts,
  validateWorkspaceRoot,
} from "../state";

describe("workspace state detector", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workbench-state-"));
    fs.mkdirSync(path.join(tempRoot, ".agents"), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, "openspec", "changes"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("validates existing project roots and rejects missing or non-project directories", () => {
    expect(validateWorkspaceRoot(tempRoot).valid).toBe(true);

    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "workbench-nonproj-"));
    try {
      const res = validateWorkspaceRoot(emptyDir);
      expect(res.valid).toBe(false);
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }

    const missing = validateWorkspaceRoot(path.join(tempRoot, "does-not-exist"));
    expect(missing.valid).toBe(false);
  });

  it("detects empty state when neither app-brief.md nor changes exist", () => {
    const state = inspectWorkspaceState(tempRoot);
    expect(state.phase).toBe("empty");
    expect(state.recommendedStage).toBe("brief");
    expect(state.hasAppBrief).toBe(false);
    expect(state.activeChanges).toHaveLength(0);
  });

  it("detects brief-ready state when app-brief.md exists without OpenSpec changes", () => {
    fs.writeFileSync(path.join(tempRoot, "app-brief.md"), "# My App Brief\nGoals...", "utf8");
    const state = inspectWorkspaceState(tempRoot);
    expect(state.phase).toBe("brief-ready");
    expect(state.recommendedStage).toBe("explore");
    expect(state.hasAppBrief).toBe(true);
  });

  it("detects proposed state when change artifacts exist with 0 completed tasks", () => {
    fs.writeFileSync(path.join(tempRoot, "app-brief.md"), "# Brief", "utf8");
    const changeDir = path.join(tempRoot, "openspec", "changes", "add-feature");
    fs.mkdirSync(path.join(changeDir, "specs", "core"), { recursive: true });
    fs.writeFileSync(path.join(changeDir, "proposal.md"), "# Proposal", "utf8");
    fs.writeFileSync(path.join(changeDir, "design.md"), "# Design", "utf8");
    fs.writeFileSync(path.join(changeDir, "specs", "core", "spec.md"), "# Spec", "utf8");
    fs.writeFileSync(path.join(changeDir, "tasks.md"), "- [ ] 1.1 First\n- [ ] 1.2 Second\n", "utf8");

    const state = inspectWorkspaceState(tempRoot);
    expect(state.phase).toBe("proposed");
    expect(state.recommendedStage).toBe("apply");
    expect(state.activeChanges[0].taskProgress).toEqual({ total: 2, completed: 0, remaining: 2 });

    const artifacts = readWorkspaceArtifacts(tempRoot);
    expect(artifacts.activeChangeName).toBe("add-feature");
    expect(artifacts.specs).toHaveLength(1);
    expect(artifacts.specs[0].name).toBe("core");
  });

  it("detects in-progress and ready-to-archive states based on tasks.md checkboxes", () => {
    const changeDir = path.join(tempRoot, "openspec", "changes", "build-mvp");
    fs.mkdirSync(changeDir, { recursive: true });
    fs.writeFileSync(path.join(changeDir, "proposal.md"), "# Proposal", "utf8");
    fs.writeFileSync(path.join(changeDir, "tasks.md"), "- [x] 1.1 Done\n- [ ] 1.2 Todo\n", "utf8");

    const inProgress = inspectWorkspaceState(tempRoot);
    expect(inProgress.phase).toBe("in-progress");
    expect(inProgress.recommendedStage).toBe("apply");

    fs.writeFileSync(path.join(changeDir, "tasks.md"), "- [x] 1.1 Done\n- [x] 1.2 Done\n", "utf8");
    const readyToArchive = inspectWorkspaceState(tempRoot);
    expect(readyToArchive.phase).toBe("ready-to-archive");
    expect(readyToArchive.recommendedStage).toBe("archive");
  });

  it("parses task progress accurately", () => {
    expect(parseTaskProgress("- [x] A\n- [X] B\n- [ ] C\n* [ ] D\n")).toEqual({
      total: 4,
      completed: 2,
      remaining: 2,
    });
  });
});
