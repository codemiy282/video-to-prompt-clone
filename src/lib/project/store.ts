// localStorage-backed CRUD for Project spine. All functions are safe to import
// anywhere: they guard against SSR (typeof window) and corrupt data.

import { MODEL_REGISTRY } from "@/lib/modelRegistry";
import type { Project } from "./types";

const KEY = "vtp.projects.v1";

function canUse(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readAll(): Project[] {
  if (!canUse()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Project[]) : [];
  } catch {
    return [];
  }
}

function writeAll(projects: Project[]): void {
  if (!canUse()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(projects));
  } catch {
    // Quota or serialization failure — best effort.
  }
}

/** Projects sorted by most-recently updated first. */
export function listProjects(): Project[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getProject(id: string): Project | undefined {
  return readAll().find((p) => p.id === id);
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Create + persist a blank project, returning it. */
export function createProject(title: string): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: newId(),
    title: title.trim() || "Untitled project",
    idea: "",
    targetModel: MODEL_REGISTRY[0]?.id ?? "veo",
    inputMode: "text",
    bibles: [],
    scenes: [],
    createdAt: now,
    updatedAt: now,
  };
  writeAll([project, ...readAll()]);
  return project;
}

/** Upsert a project, stamping updatedAt. */
export function saveProject(project: Project): void {
  const stamped: Project = { ...project, updatedAt: new Date().toISOString() };
  const all = readAll();
  const idx = all.findIndex((p) => p.id === project.id);
  if (idx >= 0) all[idx] = stamped;
  else all.unshift(stamped);
  writeAll(all);
}

export function deleteProject(id: string): void {
  writeAll(readAll().filter((p) => p.id !== id));
}

/**
 * Restore a project from an exported .json file.
 *
 * Projects live only in this browser's localStorage, so export/import is the
 * only way to move work to another machine or recover it after a cache clear.
 * A fresh id is always assigned: importing is "add a copy", never "silently
 * overwrite the project you already had open".
 *
 * Returns the stored project, or null if the file isn't a project export.
 */
export function importProject(raw: string): Project | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;

  const p = parsed as Partial<Project>;
  // Scenes and bibles are the payload; a file with neither isn't a project.
  if (!Array.isArray(p.scenes) && !Array.isArray(p.bibles)) return null;

  const now = new Date().toISOString();
  const project: Project = {
    id: newId(),
    title: typeof p.title === "string" && p.title.trim() ? p.title.trim() : "Imported project",
    idea: typeof p.idea === "string" ? p.idea : "",
    // Carried through explicitly; omitting it silently dropped the brief on
    // every export/import round trip and on every shared link.
    brief: p.brief && typeof p.brief === "object" ? p.brief : undefined,
    targetModel:
      typeof p.targetModel === "string" && MODEL_REGISTRY.some((m) => m.id === p.targetModel)
        ? p.targetModel
        : MODEL_REGISTRY[0]?.id ?? "veo",
    inputMode: p.inputMode === "image" ? "image" : "text",
    bibles: Array.isArray(p.bibles) ? p.bibles : [],
    scenes: Array.isArray(p.scenes) ? p.scenes : [],
    createdAt: typeof p.createdAt === "string" ? p.createdAt : now,
    updatedAt: now,
  };
  writeAll([project, ...readAll()]);
  return project;
}

/** Fresh scene id (exported for the workspace UI). */
export function newSceneId(): string {
  return newId();
}

/** Fresh bible-entry id (exported for the workspace UI). */
export function newBibleId(): string {
  return newId();
}
