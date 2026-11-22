import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class PathConfinementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathConfinementError";
  }
}

export class CommandNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommandNotAllowedError";
  }
}

export type DirEntry = {
  name: string;
  type: "file" | "directory";
  relativePath: string;
};

export type CommandResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

export type WorkspaceToolboxOptions = {
  projectRoot: string;
  commandFilter?: (command: string) => { allowed: boolean; reason?: string };
  writePathFilter?: (relativePath: string) => { allowed: boolean; reason?: string };
  onArtifactWritten?: (relativePath: string) => void;
  commandTimeoutMs?: number;
};

function normalizeForComparison(p: string): string {
  const resolved = path.resolve(p);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function isInsideRoot(candidatePath: string, rootPath: string): boolean {
  const normCandidate = normalizeForComparison(candidatePath);
  const normRoot = normalizeForComparison(rootPath);
  if (normCandidate === normRoot) {
    return true;
  }
  const rootWithSep = normRoot.endsWith(path.sep) ? normRoot : normRoot + path.sep;
  return normCandidate.startsWith(rootWithSep);
}

function findDeepestExistingAncestor(targetPath: string): string {
  let current = targetPath;
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return current;
}

export class WorkspaceToolbox {
  public readonly projectRoot: string;
  private readonly realProjectRoot: string;
  private readonly commandFilter?: WorkspaceToolboxOptions["commandFilter"];
  private readonly writePathFilter?: WorkspaceToolboxOptions["writePathFilter"];
  private readonly onArtifactWritten?: WorkspaceToolboxOptions["onArtifactWritten"];
  private readonly commandTimeoutMs: number;

  constructor(options: WorkspaceToolboxOptions) {
    const resolvedRoot = path.resolve(options.projectRoot);
    if (!fs.existsSync(resolvedRoot) || !fs.statSync(resolvedRoot).isDirectory()) {
      throw new PathConfinementError(`Project root does not exist or is not a directory: ${options.projectRoot}`);
    }
    this.projectRoot = resolvedRoot;
    this.realProjectRoot = fs.realpathSync(resolvedRoot);
    this.commandFilter = options.commandFilter;
    this.writePathFilter = options.writePathFilter;
    this.onArtifactWritten = options.onArtifactWritten;
    this.commandTimeoutMs = options.commandTimeoutMs ?? 60_000;
  }

  public resolveSafePath(targetPath: string): string {
    if (!targetPath || targetPath.trim() === "") {
      throw new PathConfinementError("Target path must not be empty.");
    }

    const resolved = path.resolve(this.projectRoot, targetPath);
    if (!isInsideRoot(resolved, this.projectRoot)) {
      throw new PathConfinementError(
        `Access denied: path "${targetPath}" resolves outside the selected project root.`,
      );
    }

    const ancestor = findDeepestExistingAncestor(resolved);
    if (fs.existsSync(ancestor)) {
      const realAncestor = fs.realpathSync(ancestor);
      if (!isInsideRoot(realAncestor, this.realProjectRoot)) {
        throw new PathConfinementError(
          `Access denied: path "${targetPath}" escapes the project root via symlink.`,
        );
      }
    }

    return resolved;
  }

  public toRelativePath(absolutePath: string): string {
    return path.relative(this.projectRoot, absolutePath).replace(/\\/g, "/");
  }

  public readFile(targetPath: string): { path: string; content: string } {
    const safePath = this.resolveSafePath(targetPath);
    if (!fs.existsSync(safePath)) {
      throw new Error(`File not found: ${targetPath}`);
    }
    const stat = fs.statSync(safePath);
    if (!stat.isFile()) {
      throw new Error(`Path is not a file: ${targetPath}`);
    }
    const content = fs.readFileSync(safePath, "utf8");
    return { path: this.toRelativePath(safePath), content };
  }

  public writeFile(targetPath: string, content: string): { path: string; bytesWritten: number } {
    const safePath = this.resolveSafePath(targetPath);
    const relativePath = this.toRelativePath(safePath);

    if (this.writePathFilter) {
      const check = this.writePathFilter(relativePath);
      if (!check.allowed) {
        throw new PathConfinementError(
          check.reason ?? `Writing to "${relativePath}" is not permitted in this stage.`,
        );
      }
    }

    fs.mkdirSync(path.dirname(safePath), { recursive: true });
    fs.writeFileSync(safePath, content, "utf8");
    this.notifyIfArtifact(relativePath);

    return {
      path: relativePath,
      bytesWritten: Buffer.byteLength(content, "utf8"),
    };
  }

  public editFile(
    targetPath: string,
    target: string,
    replacement: string,
  ): { path: string; replacements: number } {
    const safePath = this.resolveSafePath(targetPath);
    const relativePath = this.toRelativePath(safePath);

    if (this.writePathFilter) {
      const check = this.writePathFilter(relativePath);
      if (!check.allowed) {
        throw new PathConfinementError(
          check.reason ?? `Editing "${relativePath}" is not permitted in this stage.`,
        );
      }
    }

    if (!fs.existsSync(safePath)) {
      throw new Error(`File not found: ${targetPath}`);
    }
    const original = fs.readFileSync(safePath, "utf8");
    if (!original.includes(target)) {
      throw new Error(
        `Target text not found in "${relativePath}". Ensure exact whitespace and indentation match.`,
      );
    }

    const updated = original.split(target).join(replacement);
    const occurrences = original.split(target).length - 1;
    fs.writeFileSync(safePath, updated, "utf8");
    this.notifyIfArtifact(relativePath);

    return { path: relativePath, replacements: occurrences };
  }

  public listDir(targetPath = "."): { path: string; entries: DirEntry[] } {
    const safePath = this.resolveSafePath(targetPath);
    if (!fs.existsSync(safePath)) {
      throw new Error(`Directory not found: ${targetPath}`);
    }
    const stat = fs.statSync(safePath);
    if (!stat.isDirectory()) {
      throw new Error(`Path is not a directory: ${targetPath}`);
    }

    const ignoredNames = new Set(["node_modules", ".git", ".next"]);
    const rawEntries = fs.readdirSync(safePath, { withFileTypes: true });
    const entries: DirEntry[] = [];

    for (const entry of rawEntries) {
      if (ignoredNames.has(entry.name)) {
        continue;
      }
      const entryAbs = path.join(safePath, entry.name);
      entries.push({
        name: entry.name,
        type: entry.isDirectory() ? "directory" : "file",
        relativePath: this.toRelativePath(entryAbs),
      });
    }

    entries.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      path: this.toRelativePath(safePath) || ".",
      entries,
    };
  }

  public async runCommand(command: string): Promise<CommandResult> {
    const trimmed = command.trim();
    if (!trimmed) {
      throw new CommandNotAllowedError("Command must not be empty.");
    }

    if (this.commandFilter) {
      const check = this.commandFilter(trimmed);
      if (!check.allowed) {
        throw new CommandNotAllowedError(
          check.reason ?? `Command "${trimmed}" is not permitted in the current stage.`,
        );
      }
    }

    try {
      const { stdout, stderr } = await execAsync(trimmed, {
        cwd: this.projectRoot,
        timeout: this.commandTimeoutMs,
        maxBuffer: 2 * 1024 * 1024,
      });
      if (trimmed.startsWith("openspec ")) {
        this.onArtifactWritten?.("openspec");
      }
      return {
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        exitCode: 0,
      };
    } catch (error: unknown) {
      const err = error as { stdout?: string; stderr?: string; code?: number; message?: string };
      return {
        stdout: (err.stdout ?? "").trimEnd(),
        stderr: (err.stderr ?? err.message ?? "Command execution failed").trimEnd(),
        exitCode: typeof err.code === "number" ? err.code : 1,
      };
    }
  }

  private notifyIfArtifact(relativePath: string): void {
    const normalized = relativePath.replace(/\\/g, "/").toLowerCase();
    if (normalized === "app-brief.md" || normalized.startsWith("openspec/")) {
      this.onArtifactWritten?.(relativePath);
    }
  }
}
