import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildPreviewEnv,
  getWorkspacePreviewStatus,
  resolvePreviewCommand,
  startWorkspacePreview,
  stopWorkspacePreview,
} from "../preview-manager";

describe("workspace preview manager", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workbench-preview-"));
  });

  afterEach(async () => {
    await stopWorkspacePreview();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("injects embedded SQLite defaults and PORT into preview environment", () => {
    const env = buildPreviewEnv(4123, {});
    expect(env.PORT).toBe("4123");
    expect(env.HOSTNAME).toBe("127.0.0.1");
    expect(env.DB_CLIENT).toBe("sqlite");
    expect(env.DATABASE_URL).toBe("file:./dev.db");
  });

  it("resolves dev or start scripts from package.json and fails when missing", () => {
    expect(() => resolvePreviewCommand(tempRoot)).toThrow(/package\.json/i);

    fs.writeFileSync(
      path.join(tempRoot, "package.json"),
      JSON.stringify({ name: "demo", scripts: { dev: "node server.js" } }),
      "utf8",
    );
    expect(resolvePreviewCommand(tempRoot).scriptName).toBe("dev");
  });

  it("starts a local server on a free port, serves HTTP, and stops cleanly", async () => {
    fs.writeFileSync(
      path.join(tempRoot, "server.js"),
      [
        "const http = require('http');",
        "const port = Number(process.env.PORT);",
        "const server = http.createServer((req, res) => {",
        "  res.writeHead(200, { 'Content-Type': 'text/plain' });",
        "  res.end('ok:' + process.env.DB_CLIENT);",
        "});",
        "server.listen(port, '127.0.0.1', () => console.log('listening on ' + port));",
      ].join("\n"),
      "utf8",
    );
    fs.writeFileSync(
      path.join(tempRoot, "package.json"),
      JSON.stringify({ name: "demo", scripts: { dev: "node server.js" } }),
      "utf8",
    );

    const started = await startWorkspacePreview(tempRoot, 10_000);
    expect(started.status).toBe("running");
    expect(started.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);

    const res = await fetch(started.url!);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok:sqlite");

    const stopped = await stopWorkspacePreview();
    expect(stopped.status).toBe("idle");
    expect(getWorkspacePreviewStatus().status).toBe("idle");
  });
});
