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

/** Fresh scene id (exported for the workspace UI). */
export function newSceneId(): string {
  return newId();
}
