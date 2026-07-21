// Client-side export helpers for a Project: Markdown (human-readable production
// sheet) and JSON (round-trippable data). Downloads via a transient Blob URL.

import { getModel } from "@/lib/modelRegistry";
import type { Project } from "./types";

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "project"
  );
}

export function toMarkdown(project: Project): string {
  const modelName = getModel(project.targetModel)?.name ?? project.targetModel;
  const lines: string[] = [];
  lines.push(`# ${project.title}`, "");
  if (project.idea.trim()) {
    lines.push("## Idea", "", project.idea.trim(), "");
  }
  lines.push(
    `- **Target model:** ${modelName}`,
    `- **Input mode:** ${project.inputMode === "image" ? "Image → Video" : "Text → Video"}`,
    `- **Scenes:** ${project.scenes.length}`,
    ""
  );
  lines.push("---", "");

  project.scenes
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach((s, i) => {
      lines.push(`## Scene ${i + 1}${s.heading ? ` — ${s.heading}` : ""}`, "");
      if (s.description) lines.push(s.description, "");
      const meta: string[] = [];
      if (s.shotType) meta.push(`**Shot:** ${s.shotType}`);
      if (s.cameraMove) meta.push(`**Camera:** ${s.cameraMove}`);
      if (s.mood) meta.push(`**Mood:** ${s.mood}`);
      if (meta.length) lines.push(meta.join(" · "), "");
      if (s.prompt) {
        const pModel = getModel(s.promptModel ?? project.targetModel)?.name ?? "";
        lines.push(`### Prompt${pModel ? ` (${pModel})` : ""}`, "", "```", s.prompt, "```", "");
      }
      lines.push("---", "");
    });

  return lines.join("\n");
}

export function toJSON(project: Project): string {
  return JSON.stringify(project, null, 2);
}

export function downloadFile(filename: string, mime: string, content: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportMarkdown(project: Project): void {
  downloadFile(`${slug(project.title)}.md`, "text/markdown;charset=utf-8", toMarkdown(project));
}

export function exportJSON(project: Project): void {
  downloadFile(`${slug(project.title)}.json`, "application/json;charset=utf-8", toJSON(project));
}
