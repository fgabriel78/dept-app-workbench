import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { STAGES } from "@/lib/types";
import { buildWebAdapterPrompt } from "../prompt-builder";

describe("buildWebAdapterPrompt", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workbench-prompt-"));
    fs.mkdirSync(path.join(tempRoot, ".agents", "workflows"), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, ".agents", "rules"), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, ".agents", "skills", "openspec-explore"), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, ".agents", "skills", "openspec-propose"), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, ".agents", "skills", "openspec-apply-change"), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, ".agents", "skills", "openspec-archive-change"), { recursive: true });

    fs.writeFileSync(
      path.join(tempRoot, ".agents", "workflows", "dept-app-brief.md"),
      "WORKFLOW: Brief interview steps",
      "utf8",
    );
    fs.writeFileSync(
      path.join(tempRoot, ".agents", "rules", "app-brief-openspec-bridge.md"),
      "RULE: Bridge brief to OpenSpec",
      "utf8",
    );
    fs.writeFileSync(
      path.join(tempRoot, ".agents", "skills", "openspec-explore", "SKILL.md"),
      "SKILL: Explore read-only",
      "utf8",
    );
    fs.writeFileSync(
      path.join(tempRoot, ".agents", "skills", "openspec-propose", "SKILL.md"),
      "SKILL: Propose change",
      "utf8",
    );
    fs.writeFileSync(
      path.join(tempRoot, ".agents", "skills", "openspec-apply-change", "SKILL.md"),
      "SKILL: Apply tasks",
      "utf8",
    );
    fs.writeFileSync(
      path.join(tempRoot, ".agents", "skills", "openspec-archive-change", "SKILL.md"),
      "SKILL: Archive change",
      "utf8",
    );
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it.each(STAGES)("builds stage prompt with Web UI Adapter contract for %s", (stage) => {
    const built = buildWebAdapterPrompt(tempRoot, stage);
    expect(built.systemPrompt).toContain(`Active Stage: ${stage.toUpperCase()}`);
    expect(built.systemPrompt).toContain("ask_questions");
    expect(built.systemPrompt).toContain("mermaid");
    expect(built.systemPrompt).toContain("RULE: Bridge brief to OpenSpec");
    expect(built.loadedFiles.length).toBeGreaterThanOrEqual(2);
  });

  it("loads brief workflow specifically during brief stage", () => {
    const built = buildWebAdapterPrompt(tempRoot, "brief");
    expect(built.systemPrompt).toContain("WORKFLOW: Brief interview steps");
    expect(built.loadedFiles).toContain(".agents/workflows/dept-app-brief.md");
  });

  it("loads explore skill specifically during explore stage", () => {
    const built = buildWebAdapterPrompt(tempRoot, "explore");
    expect(built.systemPrompt).toContain("SKILL: Explore read-only");
    expect(built.loadedFiles).toContain(".agents/skills/openspec-explore/SKILL.md");
  });
});
