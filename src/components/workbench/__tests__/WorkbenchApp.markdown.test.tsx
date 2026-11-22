import { describe, expect, it } from "vitest";
import { splitMarkdownAndMermaid, unwrapMarkdownCodeFences } from "../WorkbenchApp";

describe("WorkbenchApp markdown normalization", () => {
  it("unwraps fenced markdown and md blocks into renderable markdown", () => {
    const input = [
      "Aquí tienes el resumen:",
      "",
      "```markdown",
      "# Brief Funcional",
      "",
      "## 1. Objetivo",
      "- **Problema:** Organizar tareas",
      "```",
    ].join("\n");

    const unwrapped = unwrapMarkdownCodeFences(input);
    expect(unwrapped).not.toContain("```markdown");
    expect(unwrapped).toContain("# Brief Funcional");
    expect(unwrapped).toContain("- **Problema:** Organizar tareas");

    const mdInput = "```md\n## Sección\nTexto *en cursiva*\n```";
    expect(unwrapMarkdownCodeFences(mdInput)).toBe("## Sección\nTexto *en cursiva*");
  });

  it("preserves nested mermaid and non-markdown code blocks when unwrapping markdown fences", () => {
    const input = [
      "```markdown",
      "# Arquitectura",
      "",
      "```mermaid",
      "flowchart TD",
      "  A --> B",
      "```",
      "",
      "```sql",
      "SELECT * FROM tasks;",
      "```",
      "```",
    ].join("\n");

    const parts = splitMarkdownAndMermaid(input);
    expect(parts.some((p) => p.kind === "mermaid" && p.content.includes("A --> B"))).toBe(true);
    expect(parts.some((p) => p.kind === "markdown" && p.content.includes("```sql"))).toBe(true);
    expect(parts.some((p) => p.kind === "markdown" && p.content.includes("# Arquitectura"))).toBe(true);
  });
});
