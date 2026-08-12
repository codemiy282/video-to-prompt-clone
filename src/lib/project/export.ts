// Client-side export helpers for a Project: Markdown (human-readable production
// sheet) and JSON (round-trippable data). Downloads via a transient Blob URL.

import { getModel } from "@/lib/modelRegistry";
import type { BibleEntry, Project } from "./types";

const BIBLE_LABELS: Record<BibleEntry["type"], string> = {
  character: "Character",
  object: "Object",
  location: "Location",
};

/**
 * A plain-text "consistency reference" block built from a project's bible.
 * Prepended to each scene's prompt request so recurring characters/objects/
 * locations are described the same way across every shot. Empty string when
 * there are no entries.
 */
export function buildBibleContext(bibles: BibleEntry[] | undefined): string {
  const entries = (bibles ?? []).filter((b) => b.name.trim() || b.description.trim());
  if (entries.length === 0) return "";
  const lines = entries.map(
    (b) => `- [${BIBLE_LABELS[b.type]}] ${b.name.trim()}: ${b.description.trim()}`
  );
  return `Consistency references (keep these EXACTLY consistent across every scene):\n${lines.join("\n")}`;
}

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

  const bibleEntries = (project.bibles ?? []).filter(
    (b) => b.name.trim() || b.description.trim()
  );
  if (bibleEntries.length > 0) {
    lines.push("## Bible — recurring elements", "");
    bibleEntries.forEach((b) => {
      lines.push(`- **[${BIBLE_LABELS[b.type]}] ${b.name.trim()}** — ${b.description.trim()}`);
    });
    lines.push("");
  }

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

/**
 * Escape one CSV field per RFC 4180: wrap in quotes and double any inner quote.
 * Prompts routinely contain commas, quotes and newlines, so every field is
 * quoted rather than only the ones that look risky.
 */
function csvField(value: string | undefined): string {
  return `"${(value ?? "").replace(/"/g, '""')}"`;
}

const CSV_COLUMNS = [
  "scene",
  "heading",
  "description",
  "shot_type",
  "camera_move",
  "mood",
  "target_model",
  "prompt",
] as const;

/**
 * One row per scene, for opening in Sheets or Excel — the format a team
 * actually plans a shoot in.
 *
 * Prefixed with a UTF-8 BOM because Excel otherwise reads the file as the
 * system codepage and mangles non-ASCII headings (Vietnamese diacritics,
 * Chinese characters). Sheets and LibreOffice ignore the BOM.
 */
export function toCSV(project: Project): string {
  const rows = [...project.scenes]
    .sort((a, b) => a.order - b.order)
    .map((s, i) =>
      [
        csvField(String(s.order || i + 1)),
        csvField(s.heading),
        csvField(s.description),
        csvField(s.shotType),
        csvField(s.cameraMove),
        csvField(s.mood),
        csvField(getModel(s.promptModel ?? project.targetModel)?.name ?? s.promptModel),
        csvField(s.prompt),
      ].join(",")
    );
  // CRLF line endings, which is what RFC 4180 specifies and what Excel expects.
  return "﻿" + [CSV_COLUMNS.join(","), ...rows].join("\r\n");
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

export function exportCSV(project: Project): void {
  downloadFile(`${slug(project.title)}.csv`, "text/csv;charset=utf-8", toCSV(project));
}

/** Escape text for interpolation into the print document. */
function esc(value: string | undefined): string {
  return (value ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!
  );
}

/**
 * Build a self-contained printable storyboard.
 *
 * Deliberately plain HTML with its own stylesheet rather than a PDF library:
 * every browser already renders to PDF from the print dialog, and shipping
 * jsPDF or similar would add hundreds of kilobytes to produce a worse-looking
 * document. `page-break-inside: avoid` keeps a scene from splitting across
 * pages, which is the one thing that actually matters in a shot list.
 */
export function toPrintHTML(project: Project): string {
  const modelName = getModel(project.targetModel)?.name ?? project.targetModel;
  const brief = project.brief ?? {};
  const briefRows = (
    [
      ["Audience", brief.audience],
      ["Platform", brief.platform],
      ["Runtime", brief.durationSeconds ? `${brief.durationSeconds}s` : undefined],
      ["Tone", brief.tone],
      ["Call to action", brief.cta],
      ["Target model", modelName],
    ] as const
  )
    .filter(([, v]) => v)
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(String(v))}</dd></div>`)
    .join("");

  const bibles = (project.bibles ?? [])
    .filter((b) => b.name.trim() || b.description.trim())
    .map(
      (b) =>
        `<li><strong>${esc(BIBLE_LABELS[b.type])} · ${esc(b.name)}</strong>` +
        `<span>${esc(b.description)}</span></li>`
    )
    .join("");

  const scenes = [...project.scenes]
    .sort((a, b) => a.order - b.order)
    .map((s, i) => {
      const meta = [
        s.shotType && `Shot: ${s.shotType}`,
        s.cameraMove && `Camera: ${s.cameraMove}`,
        s.mood && `Mood: ${s.mood}`,
      ]
        .filter(Boolean)
        .map((m) => `<span>${esc(String(m))}</span>`)
        .join("");
      return `<article>
  <h2>Scene ${s.order || i + 1}${s.locked ? " · approved" : ""}</h2>
  ${s.heading ? `<h3>${esc(s.heading)}</h3>` : ""}
  <p>${esc(s.description)}</p>
  ${meta ? `<div class="meta">${meta}</div>` : ""}
  ${s.prompt ? `<pre>${esc(s.prompt)}</pre>` : ""}
</article>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(project.title)}</title>
<style>
  @page { margin: 16mm; }
  * { box-sizing: border-box; }
  body { font: 12px/1.6 -apple-system, "Segoe UI", Roboto, sans-serif; color: #14161a; margin: 0; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #666; margin: 0 0 18px; }
  dl { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 20px; margin: 0 0 18px; }
  dl > div { display: flex; gap: 8px; }
  dt { color: #666; min-width: 92px; }
  dd { margin: 0; font-weight: 500; }
  h4 { font-size: 13px; margin: 18px 0 6px; }
  ul { margin: 0 0 18px; padding-left: 16px; }
  li span { display: block; color: #444; }
  article { page-break-inside: avoid; border-top: 1px solid #d8d8d8; padding: 12px 0; }
  h2 { font-size: 13px; color: #555; margin: 0 0 2px; text-transform: uppercase; letter-spacing: .04em; }
  h3 { font-size: 15px; margin: 0 0 4px; }
  article p { margin: 0 0 8px; }
  .meta { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .meta span { border: 1px solid #d8d8d8; border-radius: 4px; padding: 1px 7px; color: #555; font-size: 11px; }
  pre { white-space: pre-wrap; word-wrap: break-word; background: #f5f5f4; border-radius: 6px;
        padding: 9px 11px; margin: 0; font: 11px/1.55 ui-monospace, Menlo, Consolas, monospace; }
</style></head>
<body>
  <h1>${esc(project.title)}</h1>
  <p class="sub">${esc(project.idea)}</p>
  ${briefRows ? `<dl>${briefRows}</dl>` : ""}
  ${bibles ? `<h4>Consistency references</h4><ul>${bibles}</ul>` : ""}
  ${scenes}
</body></html>`;
}

/**
 * Open the print dialog on a printable copy of the project, where the user
 * picks "Save as PDF".
 *
 * Rendered in a hidden iframe rather than a popup: popups are commonly blocked,
 * and an iframe cannot be. The frame is removed once the dialog closes.
 */
export function exportPDF(project: Project): void {
  if (typeof window === "undefined") return;

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(toPrintHTML(project));
  doc.close();

  const win = frame.contentWindow;
  if (!win) {
    frame.remove();
    return;
  }
  // Printing is synchronous, but the frame must outlive the dialog on browsers
  // that return immediately, so removal is deferred rather than inlined.
  const cleanup = () => setTimeout(() => frame.remove(), 500);
  win.addEventListener("afterprint", cleanup, { once: true });
  win.focus();
  win.print();
  // Fallback for browsers that never fire afterprint.
  setTimeout(cleanup, 60_000);
}
