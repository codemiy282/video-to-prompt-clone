// Pure list operations on a project's scenes. Kept out of the page component so
// the ordering rules live in one place and can be reasoned about on their own.

import type { Scene } from "./types";

/**
 * Rewrite order to 1..n from the array's current sequence.
 *
 * Always applied after a structural change. Swapping numbers instead would let
 * the gaps left by deletions and inserts accumulate until the list no longer
 * reads 1, 2, 3.
 */
export function renumber(scenes: Scene[]): Scene[] {
  return scenes.map((s, i) => ({ ...s, order: i + 1 }));
}

/** Scenes in display order. */
export function ordered(scenes: Scene[]): Scene[] {
  return scenes.slice().sort((a, b) => a.order - b.order);
}

/** Move the scene at `from` to index `to`. Out-of-range indices are ignored. */
export function reorder(scenes: Scene[], from: number, to: number): Scene[] {
  const list = ordered(scenes);
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) {
    return scenes;
  }
  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved);
  return renumber(list);
}

/** Move a scene one slot earlier (-1) or later (+1). */
export function nudge(scenes: Scene[], id: string, delta: -1 | 1): Scene[] {
  const from = ordered(scenes).findIndex((s) => s.id === id);
  return from < 0 ? scenes : reorder(scenes, from, from + delta);
}

/**
 * Insert a copy of a scene directly below it.
 *
 * The copy is always unlocked — the reason to duplicate a scene is to change
 * it, and a locked copy would just need unlocking first.
 */
export function duplicate(scenes: Scene[], id: string, newId: string): Scene[] {
  const list = ordered(scenes);
  const at = list.findIndex((s) => s.id === id);
  if (at < 0) return scenes;
  list.splice(at + 1, 0, { ...list[at], id: newId, locked: false });
  return renumber(list);
}

/**
 * Break `text` into sentences, keeping the terminator attached.
 * Falls back to the whole string when nothing looks like a sentence end.
 */
function sentences(text: string): string[] {
  const parts = text.match(/[^.!?…]+[.!?…]+[\s]*|[^.!?…]+$/g);
  return (parts ?? [text]).map((s) => s.trim()).filter(Boolean);
}

/** Whether splitting this scene would actually produce two halves. */
export function canSplit(scene: Scene): boolean {
  return sentences(scene.description).length >= 2;
}

/**
 * Split one scene into two at a sentence boundary near the middle.
 *
 * A description that grew to cover two beats ("she reads the bill, then looks
 * up at the roof") is really two shots. Splitting on sentences keeps each half
 * readable, which cutting at a character count would not.
 *
 * Both halves keep the technical setup — shot, camera, mood, bible selection —
 * since that is what usually carries over. Both lose their generated prompt:
 * the text they were generated from no longer exists.
 */
export function split(scenes: Scene[], id: string, newId: string): Scene[] {
  const list = ordered(scenes);
  const at = list.findIndex((s) => s.id === id);
  if (at < 0) return scenes;

  const source = list[at];
  const parts = sentences(source.description);
  if (parts.length < 2) return scenes;

  const mid = Math.ceil(parts.length / 2);
  const first = parts.slice(0, mid).join(" ");
  const second = parts.slice(mid).join(" ");

  const head: Scene = {
    ...source,
    description: first,
    prompt: undefined,
    promptModel: undefined,
    warnings: undefined,
  };
  const tail: Scene = {
    ...source,
    id: newId,
    // Blank so the second half gets its own logline rather than a duplicate.
    heading: "",
    description: second,
    prompt: undefined,
    promptModel: undefined,
    warnings: undefined,
    locked: false,
  };

  list.splice(at, 1, head, tail);
  return renumber(list);
}
