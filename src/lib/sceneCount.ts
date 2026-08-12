// Shared by the API route and the project UI, so the scene count the form
// previews is the same one the server asks for. Lives outside gemini.ts because
// that module pulls in the Google SDK and must not reach client bundles.

/** Lower/upper bounds the scene parser keeps. */
export const MIN_SCENES = 3;
export const MAX_SCENES = 8;

/** Roughly one scene per 4 seconds — a workable default for short-form video. */
const SECONDS_PER_SCENE = 4;

export function scenesForDuration(seconds: number): number {
  return clampSceneCount(Math.round(seconds / SECONDS_PER_SCENE));
}

export function clampSceneCount(count: number): number {
  return Math.min(MAX_SCENES, Math.max(MIN_SCENES, count));
}
