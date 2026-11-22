import fs from "fs";
import path from "path";
import type {
  ActiveChangeInfo,
  StageId,
  StageSummary,
  TaskProgress,
  WorkspaceArtifacts,
  WorkspacePhase,
  WorkspaceState,
} from "@/lib/types";

export type WorkspaceValidationResult =
  | { valid: true; rootPath: string; projectName: string }
  | { valid: false; error: string };

export function validateWorkspaceRoot(dirPath: string): WorkspaceValidationResult {
  const trimmed = dirPath.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: "Please enter a local project folder path.",
    };
  }

  const resolved = path.resolve(trimmed);
  if (!fs.existsSync(resolved)) {
    return {
      valid: false,
      error: `The folder "${trimmed}" does not exist on this workstation.`,
    };
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(resolved);
  } catch {
    return {
      valid: false,
      error: `Unable to access "${trimmed}". Check folder permissions.`,
    };
  }

  if (!stat.isDirectory()) {
    return {
      valid: false,
      error: `"${trimmed}" is a file, not a folder. Please select a project directory.`,
    };
  }

  const hasAgents = fs.existsSync(path.join(resolved, ".agents"));
  const hasOpenspec = fs.existsSync(path.join(resolved, "openspec"));
  if (!hasAgents && !hasOpenspec) {
    return {
      valid: false,
      error:
        "This folder does not look like a supported project workspace (missing both `.agents/` and `openspec/`).",
    };
  }

  return {
    valid: true,
    rootPath: resolved,
    projectName: path.basename(resolved),
  };
}

export function parseTaskProgress(tasksMarkdown: string | null): TaskProgress {
  if (!tasksMarkdown) {
    return { total: 0, completed: 0, remaining: 0 };
  }
  const lines = tasksMarkdown.split(/\r?\n/);
  let total = 0;
  let completed = 0;
  for (const line of lines) {
    const match = /^\s*[-*]\s+\[([ xX])\]\s+/.exec(line);
    if (match) {
      total += 1;
      if (match[1].toLowerCase() === "x") {
        completed += 1;
      }
    }
  }
  return {
    total,
    completed,
    remaining: total - completed,
  };
}

function collectMarkdownFiles(dir: string, baseDir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(full, baseDir));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(path.relative(baseDir, full).replace(/\\/g, "/"));
    }
  }
  return results.sort();
}

export function inspectWorkspaceState(projectRoot: string): WorkspaceState {
  const resolved = path.resolve(projectRoot);
  const projectName = path.basename(resolved);
  const hasAgentsDir = fs.existsSync(path.join(resolved, ".agents"));
  const hasOpenspecDir = fs.existsSync(path.join(resolved, "openspec"));

  const appBriefPath = path.join(resolved, "app-brief.md");
  const hasAppBrief =
    fs.existsSync(appBriefPath) &&
    fs.statSync(appBriefPath).isFile() &&
    fs.readFileSync(appBriefPath, "utf8").trim().length > 0;

  const changesDir = path.join(resolved, "openspec", "changes");
  const activeChanges: ActiveChangeInfo[] = [];
  const archivedChanges: string[] = [];

  if (fs.existsSync(changesDir) && fs.statSync(changesDir).isDirectory()) {
    for (const entry of fs.readdirSync(changesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      if (entry.name === "archive") {
        const archiveDir = path.join(changesDir, "archive");
        for (const arch of fs.readdirSync(archiveDir, { withFileTypes: true })) {
          if (arch.isDirectory()) {
            archivedChanges.push(arch.name);
          }
        }
        continue;
      }

      const changeDir = path.join(changesDir, entry.name);
      const hasProposal = fs.existsSync(path.join(changeDir, "proposal.md"));
      const hasDesign = fs.existsSync(path.join(changeDir, "design.md"));
      const tasksPath = path.join(changeDir, "tasks.md");
      const hasTasks = fs.existsSync(tasksPath);
      const tasksContent = hasTasks ? fs.readFileSync(tasksPath, "utf8") : null;
      const specFiles = collectMarkdownFiles(path.join(changeDir, "specs"), changeDir);

      activeChanges.push({
        name: entry.name,
        hasProposal,
        hasDesign,
        hasSpecs: specFiles.length > 0,
        hasTasks,
        specFiles,
        taskProgress: parseTaskProgress(tasksContent),
      });
    }
  }

  activeChanges.sort((a, b) => a.name.localeCompare(b.name));
  archivedChanges.sort();

  const primaryChange = activeChanges[0];
  let phase: WorkspacePhase = "empty";
  let recommendedStage: StageId = "brief";

  if (primaryChange) {
    const { total, completed, remaining } = primaryChange.taskProgress;
    if (total > 0 && remaining === 0) {
      phase = "ready-to-archive";
      recommendedStage = "archive";
    } else if (total > 0 && completed > 0) {
      phase = "in-progress";
      recommendedStage = "apply";
    } else if (primaryChange.hasProposal || primaryChange.hasTasks || primaryChange.hasDesign) {
      phase = "proposed";
      recommendedStage = primaryChange.hasTasks ? "apply" : "propose";
    } else {
      phase = hasAppBrief ? "brief-ready" : "empty";
      recommendedStage = hasAppBrief ? "explore" : "brief";
    }
  } else if (hasAppBrief) {
    phase = "brief-ready";
    recommendedStage = "explore";
  }

  const hasProposedArtifacts = Boolean(
    primaryChange && (primaryChange.hasProposal || primaryChange.hasDesign || primaryChange.hasTasks),
  );
  const allTasksDone = Boolean(
    primaryChange && primaryChange.taskProgress.total > 0 && primaryChange.taskProgress.remaining === 0,
  );

  const stages: StageSummary[] = [
    {
      id: "brief",
      label: "Brief",
      description: "Functional interview & app-brief.md",
      status: hasAppBrief ? "completed" : recommendedStage === "brief" ? "active" : "available",
    },
    {
      id: "explore",
      label: "Explore",
      description: "Read-only architecture & requirement alignment",
      status: hasProposedArtifacts
        ? "completed"
        : recommendedStage === "explore"
          ? "active"
          : hasAppBrief
            ? "available"
            : "upcoming",
    },
    {
      id: "propose",
      label: "Propose",
      description: "Generate proposal, specs, design & tasks",
      status:
        primaryChange && primaryChange.hasTasks
          ? "completed"
          : recommendedStage === "propose"
            ? "active"
            : hasAppBrief || hasOpenspecDir
              ? "available"
              : "upcoming",
    },
    {
      id: "apply",
      label: "Apply",
      description: "Implement tasks & verify build",
      status: allTasksDone
        ? "completed"
        : recommendedStage === "apply"
          ? "active"
          : primaryChange?.hasTasks
            ? "available"
            : "upcoming",
    },
    {
      id: "archive",
      label: "Archive",
      description: "Finalize and archive completed change",
      status:
        archivedChanges.length > 0 && activeChanges.length === 0
          ? "completed"
          : recommendedStage === "archive"
            ? "active"
            : allTasksDone
              ? "available"
              : "upcoming",
    },
  ];

  return {
    rootPath: resolved,
    projectName,
    hasAgentsDir,
    hasOpenspecDir,
    hasAppBrief,
    activeChanges,
    archivedChanges,
    phase,
    recommendedStage,
    stages,
  };
}

export function readWorkspaceArtifacts(projectRoot: string, changeName?: string): WorkspaceArtifacts {
  const resolved = path.resolve(projectRoot);
  const state = inspectWorkspaceState(resolved);

  const appBriefPath = path.join(resolved, "app-brief.md");
  const appBrief = fs.existsSync(appBriefPath) ? fs.readFileSync(appBriefPath, "utf8") : null;

  const targetChange =
    (changeName ? state.activeChanges.find((c) => c.name === changeName) : state.activeChanges[0]) ??
    null;

  if (!targetChange) {
    return {
      appBrief,
      activeChangeName: null,
      proposal: null,
      design: null,
      tasks: null,
      taskProgress: { total: 0, completed: 0, remaining: 0 },
      specs: [],
    };
  }

  const changeDir = path.join(resolved, "openspec", "changes", targetChange.name);
  const readIfExists = (filePath: string) =>
    fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;

  const proposal = readIfExists(path.join(changeDir, "proposal.md"));
  const design = readIfExists(path.join(changeDir, "design.md"));
  const tasks = readIfExists(path.join(changeDir, "tasks.md"));

  const specs = targetChange.specFiles.map((relPath) => {
    const absPath = path.join(changeDir, relPath);
    const parts = relPath.split("/");
    const capabilityName = parts.length >= 2 ? parts[1] : relPath;
    return {
      name: capabilityName,
      path: relPath,
      content: fs.readFileSync(absPath, "utf8"),
    };
  });

  return {
    appBrief,
    activeChangeName: targetChange.name,
    proposal,
    design,
    tasks,
    taskProgress: parseTaskProgress(tasks),
    specs,
  };
}
