// Project spine data model. Client-side only — persisted in localStorage
// (see store.ts). No server/database: the whole pipeline lives in the browser.

import type { InputMode } from "@/lib/modelRegistry";

export interface Scene {
  id: string;
  order: number;
  /** One-line logline. */
  heading: string;
  /** Visual description (subject, setting, composition). */
  description: string;
  shotType?: string;
  cameraMove?: string;
  mood?: string;
  /** Generated, model-specific prompt for this scene (from /api/convert-prompt). */
  prompt?: string;
  /** Which registry model id the prompt targets. */
  promptModel?: string;
  /** Capability warning codes returned alongside the prompt. */
  warnings?: string[];
  /**
   * Which bible entry ids apply to this scene. `undefined` means "all" —
   * keeps older scenes (saved before per-scene selection existed) behaving
   * exactly as before, where every bible entry was injected into every scene.
   */
  bibleIds?: string[];
  /**
   * An approved shot. Locked scenes are skipped by "generate all prompts" and
   * their fields are read-only, so a batch run can't overwrite wording someone
   * already settled on. Absent means unlocked.
   */
  locked?: boolean;
}

export type BibleType = "character" | "object" | "location";

/**
 * A reusable "bible" entry — a recurring character, object, or location whose
 * description is injected into every scene prompt so it stays consistent across
 * shots (same face, same coat, same cafe).
 */
export interface BibleEntry {
  id: string;
  type: BibleType;
  name: string;
  description: string;
}

/**
 * The production context around an idea. An idea alone ("a pho cooking video")
 * leaves the model guessing at length, platform and tone, so the same input
 * produced scenes that suited nobody in particular. Every field is optional:
 * projects saved before the brief existed stay valid, and the scene breakdown
 * only mentions the parts that were filled in.
 */
export interface Brief {
  /** Who is watching, e.g. "villa owners, 35-55". */
  audience?: string;
  /** Where it will be posted — drives aspect ratio and pacing conventions. */
  platform?: string;
  /** Total runtime in seconds. Drives how many scenes are worth generating. */
  durationSeconds?: number;
  /** Desired feel, e.g. "premium, trustworthy". */
  tone?: string;
  /** The action the viewer should take at the end. */
  cta?: string;
}

export interface Project {
  id: string;
  title: string;
  idea: string;
  /** Production context for the idea. Absent on projects predating the brief. */
  brief?: Brief;
  /** Default target model id (from MODEL_REGISTRY). */
  targetModel: string;
  inputMode: InputMode;
  /** Recurring characters/objects/locations for cross-scene consistency. */
  bibles: BibleEntry[];
  scenes: Scene[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
