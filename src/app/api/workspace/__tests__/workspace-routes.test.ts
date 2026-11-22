import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as selectPost } from "../select/route";
import { POST as createPost } from "../create/route";
import { GET as artifactsGet } from "../artifacts/route";

describe("workspace API routes", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workbench-api-"));
    fs.mkdirSync(path.join(tempRoot, ".agents"), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, "app-brief.md"), "# Sales Tracker Brief", "utf8");
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("POST /api/workspace/select returns workspace state and artifacts for a valid folder", async () => {
    const req = new Request("http://localhost/api/workspace/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: tempRoot }),
    });
    const res = await selectPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.state.hasAppBrief).toBe(true);
    expect(json.artifacts.appBrief).toContain("Sales Tracker Brief");
  });

  it("POST /api/workspace/select returns 400 with clear error for invalid folder", async () => {
    const req = new Request("http://localhost/api/workspace/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: path.join(tempRoot, "missing-dir") }),
    });
    const res = await selectPost(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/does not exist/i);
  });

  it("GET /api/workspace/artifacts returns artifacts for valid path and 400 for invalid path", async () => {
    const validReq = new Request(
      `http://localhost/api/workspace/artifacts?path=${encodeURIComponent(tempRoot)}`,
    );
    const validRes = await artifactsGet(validReq);
    expect(validRes.status).toBe(200);
    const validJson = await validRes.json();
    expect(validJson.artifacts.appBrief).toContain("Sales Tracker Brief");

    const invalidReq = new Request("http://localhost/api/workspace/artifacts?path=");
    const invalidRes = await artifactsGet(invalidReq);
    expect(invalidRes.status).toBe(400);
  });

  it("returns localized validation errors and stage labels for es and ca locales", async () => {
    const esReq = new Request("http://localhost/api/workspace/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: path.join(tempRoot, "missing-dir"), locale: "es" }),
    });
    const esRes = await selectPost(esReq);
    expect(esRes.status).toBe(400);
    expect((await esRes.json()).error).toMatch(/no existe/i);

    const caReq = new Request("http://localhost/api/workspace/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: tempRoot, locale: "ca" }),
    });
    const caRes = await selectPost(caReq);
    expect(caRes.status).toBe(200);
    const caJson = await caRes.json();
    expect(caJson.state.stages.find((s: { id: string }) => s.id === "explore")?.label).toBe("Explorar");
  });

  it("POST /api/workspace/create rejects empty or invalid project names with localized errors", async () => {
    const emptyReq = new Request("http://localhost/api/workspace/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectName: "", locale: "es" }),
    });
    const emptyRes = await createPost(emptyReq);
    expect(emptyRes.status).toBe(400);
    expect((await emptyRes.json()).error).toMatch(/nombre/i);

    const invalidReq = new Request("http://localhost/api/workspace/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectName: "!!!", locale: "ca" }),
    });
    const invalidRes = await createPost(invalidReq);
    expect(invalidRes.status).toBe(400);
    expect((await invalidRes.json()).error).toMatch(/lletra o un número/i);
  });
});
