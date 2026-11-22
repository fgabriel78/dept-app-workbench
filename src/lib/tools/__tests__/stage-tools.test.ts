import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildStageTools,
  getStageCommandFilter,
  getStageWritePathFilter,
  STAGE_ALLOWED_TOOLS,
} from "../stage-tools";

describe("stage-gated tool filtering", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workbench-stage-"));
    fs.writeFileSync(path.join(tempRoot, "README.md"), "hello", "utf8");
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("excludes write_file and edit_file during explore stage", () => {
    const tools = buildStageTools({ projectRoot: tempRoot, stage: "explore" });
    expect(Object.keys(tools)).not.toContain("write_file");
    expect(Object.keys(tools)).not.toContain("edit_file");
    expect(Object.keys(tools)).toEqual(
      expect.arrayContaining(["read_file", "list_dir", "run_command", "ask_questions", "render_diagram"]),
    );
  });

  it("rejects mutating commands during explore stage", () => {
    const filter = getStageCommandFilter("explore");
    expect(filter("openspec list --json").allowed).toBe(true);
    expect(filter("openspec context --json").allowed).toBe(true);
    expect(filter("openspec status --change demo --json").allowed).toBe(true);
    expect(filter("openspec new change demo").allowed).toBe(false);
    expect(filter("npm install").allowed).toBe(false);
    expect(filter("openspec list && rm -rf .").allowed).toBe(false);
    expect(getStageCommandFilter("propose")("openspec context --json").allowed).toBe(true);
  });

  it("grants full workspace tools including write_file, edit_file, and run_command during apply and test", () => {
    for (const stage of ["apply", "test"] as const) {
      const tools = buildStageTools({ projectRoot: tempRoot, stage });
      expect(Object.keys(tools)).toEqual(
        expect.arrayContaining([
          "read_file",
          "list_dir",
          "write_file",
          "edit_file",
          "run_command",
          "ask_questions",
          "render_diagram",
        ]),
      );
      const filter = getStageCommandFilter(stage);
      expect(filter("npx tsc --noEmit").allowed).toBe(true);
      expect(filter("npm run build").allowed).toBe(true);
    }
  });

  it("scopes brief writes to app-brief.md and propose writes to openspec/", () => {
    const briefFilter = getStageWritePathFilter("brief")!;
    expect(briefFilter("app-brief.md").allowed).toBe(true);
    expect(briefFilter("src/index.ts").allowed).toBe(false);

    const proposeFilter = getStageWritePathFilter("propose")!;
    expect(proposeFilter("openspec/changes/demo/proposal.md").allowed).toBe(true);
    expect(proposeFilter("package.json").allowed).toBe(false);
  });

  it("restricts archive stage to openspec archive and read-only tools", () => {
    expect(STAGE_ALLOWED_TOOLS.archive).not.toContain("write_file");
    expect(STAGE_ALLOWED_TOOLS.archive).not.toContain("edit_file");
    const filter = getStageCommandFilter("archive");
    expect(filter("openspec archive demo").allowed).toBe(true);
    expect(filter("openspec instructions archive --change demo --json").allowed).toBe(true);
    expect(filter("openspec context --json").allowed).toBe(true);
    expect(filter("npm run build").allowed).toBe(false);
  });

  it("emits localized tool activity labels for es and ca", async () => {
    const activities: string[] = [];
    const tools = buildStageTools({
      projectRoot: tempRoot,
      stage: "explore",
      locale: "ca",
      onActivity: (act) => activities.push(act.label),
    });

    await tools.read_file.execute!(
      { path: "README.md" },
      { toolCallId: "tc-1", messages: [] },
    );
    expect(activities[0]).toBe("Llegint README.md");
    expect(activities[1]).toBe("Llegit README.md");
  });
});
