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
}

export interface Project {
  id: string;
  title: string;
  idea: string;
  /** Default target model id (from MODEL_REGISTRY). */
  targetModel: string;
  inputMode: InputMode;
  scenes: Scene[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
