import { execFile, spawn, type ChildProcess } from "child_process";
import fs from "fs";
import net from "net";
import path from "path";
import { promisify } from "util";
import type { PreviewStatus } from "@/lib/types";
import { stripAnsi } from "@/lib/tools/workspace-toolbox";

const execFileAsync = promisify(execFile);
const MAX_LOG_LINES = 200;
const STARTUP_TIMEOUT_MS = 30_000;

type InternalPreviewState = PreviewStatus & {
  child: ChildProcess | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __deptWorkbenchPreview: InternalPreviewState | undefined;
}

function getStore(): InternalPreviewState {
  if (!globalThis.__deptWorkbenchPreview) {
    globalThis.__deptWorkbenchPreview = {
      status: "idle",
      projectRoot: null,
      port: null,
      url: null,
      logs: [],
      error: null,
      child: null,
    };
  }
  return globalThis.__deptWorkbenchPreview;
}

function appendLogLines(state: InternalPreviewState, chunk: Buffer | string) {
  const cleaned = stripAnsi(chunk.toString());
  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return;
  state.logs.push(...lines);
  if (state.logs.length > MAX_LOG_LINES) {
    state.logs.splice(0, state.logs.length - MAX_LOG_LINES);
  }
}

export function buildPreviewEnv(
  port: number,
  baseEnv: Record<string, string | undefined> = process.env,
): NodeJS.ProcessEnv {
  return {
    ...baseEnv,
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    DB_CLIENT: baseEnv.DB_CLIENT || "sqlite",
    DATABASE_URL: "file:./dev.db",
  } as unknown as NodeJS.ProcessEnv;
}

export function resolvePreviewCommand(projectRoot: string): {
  command: string;
  args: string[];
  scriptName: string;
} {
  const pkgPath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(pkgPath)) {
    throw new Error("No package.json found in workspace root.");
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
    scripts?: Record<string, string>;
  };
  const scripts = pkg.scripts ?? {};
  const scriptName = scripts.dev ? "dev" : scripts.start ? "start" : null;
  if (!scriptName) {
    throw new Error("package.json has neither a `dev` nor a `start` script.");
  }

  return {
    command: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["run", scriptName],
    scriptName,
  };
}

export function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        server.close(() => reject(new Error("Failed to allocate a free TCP port.")));
        return;
      }
      const { port } = addr;
      server.close((err) => (err ? reject(err) : resolve(port)));
    });
  });
}

async function waitForServerReady(url: string, state: InternalPreviewState, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!state.child || state.status === "error" || state.status === "idle") {
      throw new Error(state.error ?? "Preview server exited before becoming ready.");
    }
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.status > 0) {
        return;
      }
    } catch {
      // still starting
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  throw new Error(`Preview server did not respond on ${url} within ${Math.round(timeoutMs / 1000)}s.`);
}

export function getWorkspacePreviewStatus(): PreviewStatus {
  const s = getStore();
  return {
    status: s.status,
    projectRoot: s.projectRoot,
    port: s.port,
    url: s.url,
    logs: [...s.logs],
    error: s.error,
  };
}

export async function stopWorkspacePreview(): Promise<PreviewStatus> {
  const state = getStore();
  const child = state.child;
  state.child = null;

  if (child && child.pid) {
    try {
      if (process.platform === "win32") {
        await execFileAsync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
          windowsHide: true,
        }).catch(() => undefined);
      } else {
        child.kill("SIGTERM");
      }
    } catch {
      // ignore termination errors
    }
  }

  state.status = "idle";
  state.port = null;
  state.url = null;
  state.error = null;
  return getWorkspacePreviewStatus();
}

export async function startWorkspacePreview(
  projectRoot: string,
  timeoutMs = STARTUP_TIMEOUT_MS,
): Promise<PreviewStatus> {
  await stopWorkspacePreview();

  const state = getStore();
  state.projectRoot = projectRoot;
  state.logs = [];
  state.error = null;
  state.status = "starting";

  try {
    const { command, args } = resolvePreviewCommand(projectRoot);
    const port = await findFreePort();
    const url = `http://127.0.0.1:${port}`;
    state.port = port;
    state.url = url;

    const child = spawn(command, args, {
      cwd: projectRoot,
      env: buildPreviewEnv(port),
      shell: process.platform === "win32",
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    state.child = child;
    child.stdout?.on("data", (chunk) => appendLogLines(state, chunk));
    child.stderr?.on("data", (chunk) => appendLogLines(state, chunk));
    child.on("exit", (code) => {
      if (state.child === child) {
        state.child = null;
        if (state.status === "starting" || (code !== 0 && code !== null)) {
          state.status = "error";
          state.error = `Preview process exited with code ${code ?? "unknown"}.`;
        } else {
          state.status = "idle";
        }
      }
    });

    await waitForServerReady(url, state, timeoutMs);
    if (state.child === child) {
      state.status = "running";
    }
    return getWorkspacePreviewStatus();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await stopWorkspacePreview();
    state.status = "error";
    state.error = message;
    return getWorkspacePreviewStatus();
  }
}
