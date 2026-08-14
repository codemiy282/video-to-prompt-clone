"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconPlus,
  IconTrash,
  IconArrowLeft,
  IconLoader2,
  IconWand,
  IconCopy,
  IconCheck,
  IconAlertTriangle,
  IconFileText,
  IconFileCode,
  IconUpload,
  IconTable,
  IconLock,
  IconLockOpen,
  IconArrowUp,
  IconArrowDown,
  IconGripVertical,
  IconCut,
  IconPrinter,
  IconMovie,
  IconVideo,
  IconPhoto,
  IconUser,
  IconBox,
  IconMapPin,
  IconEye,
  IconShare,
} from "@tabler/icons-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { MODEL_REGISTRY, type InputMode } from "@/lib/modelRegistry";
import type { BibleType, Brief, Project, Scene } from "@/lib/project/types";
import { scenesForDuration } from "@/lib/sceneCount";
import {
  renumber,
  ordered,
  reorder,
  nudge,
  duplicate as duplicateScene_,
  split,
  canSplit,
} from "@/lib/project/scenes";
import {
  listProjects,
  createProject,
  saveProject,
  deleteProject,
  newSceneId,
  newBibleId,
  importProject,
} from "@/lib/project/store";
import {
  buildScenePromptInput,
  promptFingerprint,
  isPromptStale,
} from "@/lib/project/promptSource";
import {
  exportMarkdown,
  exportJSON,
  exportCSV,
  exportPDF,
} from "@/lib/project/export";
import { buildShareLink, readShareLink, shareSupported, ShareTooLargeError } from "@/lib/project/share";

const BIBLE_TYPES: BibleType[] = ["character", "object", "location"];

/** One labelled text input in the brief grid. */
function BriefField({
  label,
  placeholder,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-muted-foreground text-xs">{label}</label>
      <input
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={200}
        className="h-10 w-full rounded-lg border-2 border-border bg-transparent px-3 text-foreground text-sm outline-none focus:border-primary"
      />
    </div>
  );
}

function bibleIcon(type: BibleType) {
  if (type === "character") return <IconUser className="size-3.5" />;
  if (type === "object") return <IconBox className="size-3.5" />;
  return <IconMapPin className="size-3.5" />;
}

export default function ProjectsPage() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [active, setActive] = useState<Project | null>(null);

  // A project carried in the URL fragment. Held separately from `active` so a
  // shared copy is never written to this browser's own project list unless the
  // reader explicitly saves it.
  const [shared, setShared] = useState<Project | null>(null);

  useEffect(() => {
    setMounted(true);
    setProjects(listProjects());

    const open = () => {
      void readShareLink(window.location.hash).then((p) => {
        if (p) setShared(p);
      });
    };
    open();
    // Pasting a share link while already on this page only changes the hash,
    // which is a same-document navigation — no reload, so nothing else would
    // notice it.
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);

  /** Take a shared project as your own, then drop the link state. */
  function keepShared() {
    if (!shared) return;
    const mine = importProject(JSON.stringify(shared));
    setShared(null);
    history.replaceState(null, "", window.location.pathname);
    if (mine) {
      refresh();
      setActive(mine);
    }
  }

  function dismissShared() {
    setShared(null);
    history.replaceState(null, "", window.location.pathname);
  }

  function refresh() {
    setProjects(listProjects());
  }

  function handleNew() {
    const p = createProject(t("project.untitled"));
    refresh();
    setActive(p);
  }

  function handleOpen(p: Project) {
    setActive(p);
  }

  function handleDelete(id: string) {
    if (!window.confirm(t("project.confirmDelete"))) return;
    deleteProject(id);
    refresh();
    if (active?.id === id) setActive(null);
  }

  async function handleImport(file: File) {
    const restored = importProject(await file.text());
    if (!restored) {
      window.alert(t("project.importInvalid"));
      return;
    }
    refresh();
    setActive(restored);
  }

  // Persist + keep the active project in sync.
  function update(next: Project) {
    setActive(next);
    saveProject(next);
    refresh();
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <IconLoader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <section className="pt-12 pb-20">
        <div className="container mx-auto max-w-4xl px-6">
          {shared ? (
            <>
              <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3">
                <IconEye className="size-4 shrink-0 text-primary" />
                <span className="flex-1 text-foreground text-sm">{t("project.sharedBanner")}</span>
                <button
                  onClick={keepShared}
                  className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground text-sm hover:opacity-90"
                >
                  {t("project.sharedKeep")}
                </button>
                <button
                  onClick={dismissShared}
                  className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-border px-4 text-muted-foreground text-sm hover:text-foreground"
                >
                  {t("project.sharedDismiss")}
                </button>
              </div>
              <Workspace project={shared} readOnly onBack={dismissShared} onChange={() => {}} />
            </>
          ) : active ? (
            <Workspace
              project={active}
              onBack={() => {
                setActive(null);
                refresh();
              }}
              onChange={update}
            />
          ) : (
            <ProjectList
              projects={projects}
              onNew={handleNew}
              onOpen={handleOpen}
              onDelete={handleDelete}
              onImport={handleImport}
            />
          )}
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------- List ---------------------------------- */

function ProjectList({
  projects,
  onNew,
  onOpen,
  onDelete,
  onImport,
}: {
  projects: Project[];
  onNew: () => void;
  onOpen: (p: Project) => void;
  onDelete: (id: string) => void;
  onImport: (file: File) => void;
}) {
  const { t } = useLanguage();
  const importRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <div className="text-center">
        <h1 className="font-bold text-4xl text-foreground sm:text-5xl">{t("project.title")}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">{t("project.subtitle")}</p>
      </div>

      {/* Projects never leave this browser, so say so where it matters — before
          someone invests an hour in a storyboard they can't get back. */}
      <p className="mx-auto mt-6 flex max-w-2xl items-start gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-muted-foreground text-xs">
        <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
        <span>{t("project.storageNotice")}</span>
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => importRef.current?.click()}
          className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-6 font-medium text-foreground text-sm transition-colors hover:bg-muted"
        >
          <IconUpload className="size-4" />
          {t("project.import")}
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onImport(f);
          }}
        />
        <button
          onClick={onNew}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm h-12 px-8 hover:opacity-90 cursor-pointer transition-all"
        >
          <IconPlus className="size-4" />
          {t("project.new")}
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">{t("project.emptyList")}</p>
      ) : (
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <button onClick={() => onOpen(p)} className="w-full text-left cursor-pointer">
                <h3 className="font-semibold text-base text-foreground line-clamp-1">{p.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {p.idea.trim() || t("project.empty")}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("project.scenesCount", { n: p.scenes.length })}
                </p>
              </button>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => onDelete(p.id)}
                  aria-label={t("project.delete")}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-red-500 hover:border-red-500/40 transition-colors cursor-pointer"
                >
                  <IconTrash className="size-3.5" />
                  {t("project.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* -------------------------------- Workspace ------------------------------- */

function Workspace({
  project,
  onBack,
  onChange,
  readOnly = false,
}: {
  project: Project;
  onBack: () => void;
  onChange: (p: Project) => void;
  /** Viewing someone else's shared link: show everything, change nothing. */
  readOnly?: boolean;
}) {
  const { t } = useLanguage();
  const [scenesLoading, setScenesLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptLoadingId, setPromptLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Index of the card being dragged, and the one it would land on.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [sharedCopied, setSharedCopied] = useState(false);

  const scenes = ordered(project.scenes);
  const bibles = project.bibles ?? [];

  // Batch generation runs several sequential awaits inside one async closure.
  // Each patch triggers a re-render with a new `project` prop, but the
  // in-flight closure keeps referencing the `project` it captured at call
  // time — so writes based on the stale value would clobber earlier writes.
  // A ref sidesteps that: patch/patchScene always read the latest project.
  const projectRef = useRef(project);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  // Merges into the existing brief so editing one field doesn't clear the rest,
  // and drops the whole object once every field is empty.
  function patchBrief(partial: Partial<Brief>) {
    const next: Brief = { ...project.brief, ...partial };
    for (const k of Object.keys(next) as (keyof Brief)[]) {
      if (next[k] === undefined || next[k] === "") delete next[k];
    }
    patch({ brief: Object.keys(next).length > 0 ? next : undefined });
  }

  function patch(partial: Partial<Project>) {
    // Single choke point: a shared link is a view, so no edit can reach state
    // even if a control somehow stays interactive.
    if (readOnly) return;
    onChange({ ...projectRef.current, ...partial });
  }

  function addBible(type: BibleType) {
    patch({ bibles: [...bibles, { id: newBibleId(), type, name: "", description: "" }] });
  }

  function patchBible(id: string, name: string, description: string, type: BibleType) {
    patch({ bibles: bibles.map((b) => (b.id === id ? { id, type, name, description } : b)) });
  }

  function removeBible(id: string) {
    patch({ bibles: bibles.filter((b) => b.id !== id) });
  }

  // Undefined bibleIds means "applies to all" (backward-compatible default).
  // The first toggle on a scene materializes that into an explicit list.
  function toggleSceneBible(sceneId: string, bibleId: string) {
    const scene = project.scenes.find((s) => s.id === sceneId);
    if (!scene) return;
    const current = scene.bibleIds ?? bibles.map((b) => b.id);
    const next = current.includes(bibleId)
      ? current.filter((id) => id !== bibleId)
      : [...current, bibleId];
    patchScene(sceneId, { bibleIds: next });
  }

  function patchScene(id: string, partial: Partial<Scene>) {
    patch({
      scenes: projectRef.current.scenes.map((s) => (s.id === id ? { ...s, ...partial } : s)),
    });
  }

  function removeScene(id: string) {
    patch({ scenes: renumber(project.scenes.filter((s) => s.id !== id)) });
  }

  function moveScene(id: string, delta: -1 | 1) {
    patch({ scenes: nudge(project.scenes, id, delta) });
  }

  function duplicateScene(id: string) {
    patch({ scenes: duplicateScene_(project.scenes, id, newSceneId()) });
  }

  function splitScene(id: string) {
    patch({ scenes: split(project.scenes, id, newSceneId()) });
  }

  /**
   * Put a read-only link on the clipboard. The project rides in the URL
   * fragment, so a big one simply won't fit — say so and point at the export
   * rather than handing over a link that arrives truncated.
   */
  async function handleShare() {
    try {
      const url = await buildShareLink(project, window.location.origin);
      await navigator.clipboard.writeText(url);
      setSharedCopied(true);
      setTimeout(() => setSharedCopied(false), 2500);
    } catch (err) {
      setError(
        err instanceof ShareTooLargeError
          ? t("project.shareTooLarge")
          : t("common.requestFailed")
      );
    }
  }

  /** Drop the card being dragged onto position `to`. */
  function dropScene(to: number) {
    const from = dragIndex;
    setDragIndex(null);
    setDragOverIndex(null);
    if (from === null) return;
    patch({ scenes: reorder(project.scenes, from, to) });
  }

  function toggleLock(id: string) {
    const scene = project.scenes.find((s) => s.id === id);
    if (scene) patchScene(id, { locked: !scene.locked });
  }

  function addScene() {
    const order = project.scenes.reduce((m, s) => Math.max(m, s.order), 0) + 1;
    patch({
      scenes: [
        ...project.scenes,
        { id: newSceneId(), order, heading: "", description: "" },
      ],
    });
  }

  async function generateScenes() {
    if (!project.idea.trim()) {
      setError(t("project.needIdea"));
      return;
    }
    setScenesLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/project/scenes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idea: project.idea.trim(), brief: project.brief }),
      });
      const data = await res.json();
      if (data.success) {
        const built: Scene[] = data.scenes.map((s: Partial<Scene>, i: number) => ({
          id: newSceneId(),
          order: i + 1,
          heading: s.heading ?? "",
          description: s.description ?? "",
          shotType: s.shotType,
          cameraMove: s.cameraMove,
          mood: s.mood,
        }));
        patch({ scenes: built });
      } else {
        setError(data.message || t("project.errorScenes"));
      }
    } catch {
      setError(t("common.networkError"));
    } finally {
      setScenesLoading(false);
    }
  }

  async function generatePrompt(scene: Scene): Promise<boolean> {
    // Built by the same helper the fingerprint uses, so "what the prompt was
    // generated from" is defined in exactly one place.
    const base = buildScenePromptInput(scene, bibles);
    if (!base.trim()) return false;
    const source = promptFingerprint(scene, bibles, project.targetModel, project.inputMode);

    setPromptLoadingId(scene.id);
    setError(null);
    try {
      const res = await fetch("/api/convert-prompt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: base,
          models: [project.targetModel],
          inputMode: project.inputMode,
        }),
      });
      const data = await res.json();
      if (data.success && data.results?.[0]) {
        patchScene(scene.id, {
          prompt: data.results[0].prompt,
          promptModel: project.targetModel,
          promptSource: source,
          warnings: data.results[0].warnings ?? [],
        });
        return true;
      }
      setError(data.message || t("project.errorPrompt"));
      return false;
    } catch {
      setError(t("common.networkError"));
      return false;
    } finally {
      setPromptLoadingId(null);
    }
  }

  // Sequential (not parallel): respects the /api/convert-prompt rate limit and
  // lets the per-scene spinner progress naturally from scene to scene. Stops
  // on the first failure (e.g. rate limit) rather than firing more requests.
  async function generateAllPrompts() {
    // Locked scenes are approved work — a batch run must not spend a call
    // overwriting them. Scenes whose prompt is still current are skipped too:
    // regenerating them would cost a Gemini call to reproduce what is already
    // there, and quota is the scarcest thing this project has.
    const targets = scenes.filter(
      (s) =>
        s.description.trim() &&
        !s.locked &&
        (!s.prompt || isPromptStale(s, bibles, project.targetModel, project.inputMode))
    );
    if (targets.length === 0) return;
    setBatchLoading(true);
    setError(null);
    let done = 0;
    for (const scene of targets) {
      const ok = await generatePrompt(scene);
      if (!ok) break;
      done++;
    }
    setBatchLoading(false);
    if (done < targets.length) {
      setError(t("project.batchPartial", { done, total: targets.length }));
    }
  }

  async function copy(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
  }

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <IconArrowLeft className="size-4" />
          {t("project.back")}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportMarkdown(project)}
            disabled={project.scenes.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-40"
          >
            <IconFileText className="size-4" />
            {t("project.exportMd")}
          </button>
          <button
            onClick={() => exportJSON(project)}
            disabled={project.scenes.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-40"
          >
            <IconFileCode className="size-4" />
            {t("project.exportJson")}
          </button>
          <button
            onClick={() => exportCSV(project)}
            disabled={project.scenes.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-40"
          >
            <IconTable className="size-4" />
            {t("project.exportCsv")}
          </button>
          <button
            onClick={() => exportPDF(project)}
            disabled={project.scenes.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-40"
          >
            <IconPrinter className="size-4" />
            {t("project.exportPdf")}
          </button>
          {!readOnly && shareSupported() && (
            <button
              onClick={handleShare}
              disabled={project.scenes.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-40"
            >
              {sharedCopied ? <IconCheck className="size-4 text-green-500" /> : <IconShare className="size-4" />}
              {sharedCopied ? t("project.shareCopied") : t("project.share")}
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <input
        value={project.title}
        readOnly={readOnly}
        onChange={(e) => patch({ title: e.target.value })}
        placeholder={t("project.titlePlaceholder")}
        className="mt-6 w-full bg-transparent text-3xl font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
      />

      {/* Idea */}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-2 text-foreground">{t("project.ideaLabel")}</label>
        <textarea
          value={project.idea}
          readOnly={readOnly}
          onChange={(e) => patch({ idea: e.target.value })}
          placeholder={t("project.ideaPlaceholder")}
          maxLength={4000}
          className="w-full h-28 rounded-lg bg-transparent border-2 border-border p-3 text-sm focus:border-primary text-foreground resize-none outline-none"
        />
      </div>

      {/* Brief. Everything here is optional and only the filled-in parts reach
          the model, so an idea on its own still works exactly as before. */}
      <div className="mt-5 rounded-xl border border-border p-4">
        <p className="font-medium text-foreground text-sm">{t("project.briefLabel")}</p>
        <p className="mt-1 text-muted-foreground text-xs">{t("project.briefHint")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <BriefField
            label={t("project.briefAudience")}
            placeholder={t("project.briefAudiencePh")}
            value={project.brief?.audience ?? ""}
            readOnly={readOnly}
            onChange={(v) => patchBrief({ audience: v })}
          />
          <BriefField
            label={t("project.briefPlatform")}
            placeholder={t("project.briefPlatformPh")}
            value={project.brief?.platform ?? ""}
            readOnly={readOnly}
            onChange={(v) => patchBrief({ platform: v })}
          />
          <BriefField
            label={t("project.briefTone")}
            placeholder={t("project.briefTonePh")}
            value={project.brief?.tone ?? ""}
            readOnly={readOnly}
            onChange={(v) => patchBrief({ tone: v })}
          />
          <BriefField
            label={t("project.briefCta")}
            placeholder={t("project.briefCtaPh")}
            value={project.brief?.cta ?? ""}
            readOnly={readOnly}
            onChange={(v) => patchBrief({ cta: v })}
          />
          <div>
            <label className="mb-1.5 block text-muted-foreground text-xs">
              {t("project.briefDuration")}
            </label>
            <input
              type="number"
              readOnly={readOnly}
              min={1}
              max={600}
              value={project.brief?.durationSeconds ?? ""}
              onChange={(e) =>
                patchBrief({
                  durationSeconds: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="30"
              className="h-10 w-full rounded-lg border-2 border-border bg-transparent px-3 text-foreground text-sm outline-none focus:border-primary"
            />
            {project.brief?.durationSeconds ? (
              <p className="mt-1.5 text-muted-foreground text-xs">
                {t("project.briefSceneEstimate", {
                  count: scenesForDuration(project.brief.durationSeconds),
                })}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Target model + input mode */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">{t("project.targetModel")}</label>
          <div className="flex flex-wrap gap-2">
            {MODEL_REGISTRY.map((m) => {
              const on = project.targetModel === m.id;
              return (
                <button
                  key={m.id}
                  disabled={readOnly}
                  onClick={() => patch({ targetModel: m.id })}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 h-9 text-sm font-medium transition-colors cursor-pointer ${
                    on
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {on && <IconCheck className="size-3.5 text-primary" />}
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">{t("project.inputMode")}</label>
          <div className="grid grid-cols-2 gap-2 max-w-xs">
            {(["text", "image"] as InputMode[]).map((mode) => (
              <button
                key={mode}
                disabled={readOnly}
                onClick={() => patch({ inputMode: mode })}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 h-9 text-sm font-medium transition-colors cursor-pointer ${
                  project.inputMode === mode
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {mode === "text" ? <IconVideo className="size-4" /> : <IconPhoto className="size-4" />}
                {mode === "text" ? t("project.modeText") : t("project.modeImage")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bible — recurring elements for cross-scene consistency */}
      <div className="mt-8">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-foreground">{t("project.bible.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("project.bible.subtitle")}</p>
        </div>

        {bibles.length > 0 && (
          <div className="mb-3 space-y-2">
            {bibles.map((b) => (
              <div key={b.id} className="rounded-xl border border-border bg-card p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  {BIBLE_TYPES.map((tp) => (
                    <button
                      key={tp}
                      disabled={readOnly}
                      onClick={() => patchBible(b.id, b.name, b.description, tp)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 h-7 text-xs font-medium transition-colors cursor-pointer ${
                        b.type === tp
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {bibleIcon(tp)}
                      {t(`project.bible.${tp}`)}
                    </button>
                  ))}
                  <button
                    disabled={readOnly}
                    onClick={() => removeBible(b.id)}
                    aria-label={t("project.bible.remove")}
                    className="ml-auto inline-flex items-center rounded-lg border border-border p-1.5 text-muted-foreground hover:text-red-500 hover:border-red-500/40 transition-colors cursor-pointer"
                  >
                    <IconTrash className="size-3.5" />
                  </button>
                </div>
                <input
                  value={b.name}
                  readOnly={readOnly}
                  onChange={(e) => patchBible(b.id, e.target.value, b.description, b.type)}
                  placeholder={t("project.bible.namePlaceholder")}
                  className="mb-1.5 w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
                />
                <textarea
                  value={b.description}
                  readOnly={readOnly}
                  onChange={(e) => patchBible(b.id, b.name, e.target.value, b.type)}
                  placeholder={t("project.bible.descPlaceholder")}
                  className="h-16 w-full resize-none rounded-lg border border-border bg-transparent p-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {BIBLE_TYPES.map((tp) => (
            <button
              key={tp}
              disabled={readOnly}
              onClick={() => addBible(tp)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 h-9 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <IconPlus className="size-3.5" />
              {t(`project.bible.${tp}`)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Generate scenes */}
      {!readOnly && (
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={generateScenes}
          disabled={scenesLoading || !project.idea.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm h-11 px-6 hover:opacity-90 disabled:opacity-50 cursor-pointer transition-all"
        >
          {scenesLoading ? <IconLoader2 className="size-4 animate-spin" /> : <IconMovie className="size-4" />}
          {scenesLoading ? t("project.generatingScenes") : t("project.generateScenes")}
        </button>
        <button
          onClick={addScene}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 h-11 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <IconPlus className="size-4" />
          {t("project.addScene")}
        </button>
        {scenes.length > 0 && (
          <button
            onClick={generateAllPrompts}
            disabled={batchLoading || promptLoadingId !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-4 h-11 text-sm text-foreground hover:bg-primary/10 disabled:opacity-40 transition-colors cursor-pointer"
          >
            {batchLoading ? <IconLoader2 className="size-4 animate-spin" /> : <IconWand className="size-4 text-primary" />}
            {batchLoading ? t("project.generatingAll") : t("project.generateAllPrompts")}
          </button>
        )}
      </div>
      )}

      {/* Scenes */}
      <div className="mt-8 space-y-4">
        {scenes.map((scene, i) => (
          <div
            key={scene.id}
            onDragOver={(e) => {
              // Without preventDefault the browser refuses the drop.
              e.preventDefault();
              if (dragIndex !== null && dragOverIndex !== i) setDragOverIndex(i);
            }}
            onDrop={(e) => {
              e.preventDefault();
              dropScene(i);
            }}
            className={`rounded-2xl border bg-card p-5 transition-all ${
              scene.locked ? "border-primary/40 bg-primary/5" : "border-border"
            } ${dragIndex === i ? "opacity-40" : ""} ${
              dragOverIndex === i && dragIndex !== i ? "border-primary ring-2 ring-primary/30" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="flex items-center gap-2 font-semibold text-sm text-primary">
                {/* Only the handle is draggable — making the whole card
                    draggable would hijack text selection in its inputs. */}
                <span
                  draggable
                  onDragStart={(e) => {
                    setDragIndex(i);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  role="button"
                  tabIndex={-1}
                  aria-label={t("project.dragScene")}
                  title={t("project.dragScene")}
                  className="cursor-grab text-muted-foreground active:cursor-grabbing"
                >
                  <IconGripVertical className="size-4" />
                </span>
                {t("project.scene", { n: i + 1 })}
                {scene.locked && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 font-medium text-[11px]">
                    <IconLock className="size-3" />
                    {t("project.locked")}
                  </span>
                )}
              </h3>
              {!readOnly && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => moveScene(scene.id, -1)}
                  disabled={i === 0}
                  aria-label={t("project.moveUp")}
                  className="inline-flex items-center rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-30 cursor-pointer"
                >
                  <IconArrowUp className="size-3.5" />
                </button>
                <button
                  onClick={() => moveScene(scene.id, 1)}
                  disabled={i === scenes.length - 1}
                  aria-label={t("project.moveDown")}
                  className="inline-flex items-center rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-30 cursor-pointer"
                >
                  <IconArrowDown className="size-3.5" />
                </button>
                <button
                  onClick={() => duplicateScene(scene.id)}
                  aria-label={t("project.duplicateScene")}
                  className="inline-flex items-center rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground cursor-pointer"
                >
                  <IconCopy className="size-3.5" />
                </button>
                <button
                  onClick={() => splitScene(scene.id)}
                  // Nothing to split when the description is a single sentence.
                  disabled={scene.locked || !canSplit(scene)}
                  aria-label={t("project.splitScene")}
                  title={t("project.splitScene")}
                  className="inline-flex items-center rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-30 cursor-pointer"
                >
                  <IconCut className="size-3.5" />
                </button>
                <button
                  onClick={() => toggleLock(scene.id)}
                  aria-label={scene.locked ? t("project.unlockScene") : t("project.lockScene")}
                  className={`inline-flex items-center rounded-lg border p-1.5 transition-colors cursor-pointer ${
                    scene.locked
                      ? "border-primary/40 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {scene.locked ? <IconLock className="size-3.5" /> : <IconLockOpen className="size-3.5" />}
                </button>
                <button
                  onClick={() => removeScene(scene.id)}
                  aria-label={t("project.deleteScene")}
                  className="inline-flex items-center rounded-lg border border-border p-1.5 text-muted-foreground hover:text-red-500 hover:border-red-500/40 transition-colors cursor-pointer"
                >
                  <IconTrash className="size-3.5" />
                </button>
              </div>
              )}
            </div>

            <input
              value={scene.heading}
              readOnly={readOnly || scene.locked}
              onChange={(e) => patchScene(scene.id, { heading: e.target.value })}
              placeholder={t("project.sceneHeading")}
              className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50 mb-2 read-only:text-muted-foreground"
            />
            <textarea
              value={scene.description}
              readOnly={readOnly || scene.locked}
              onChange={(e) => patchScene(scene.id, { description: e.target.value })}
              placeholder={t("project.sceneDescription")}
              className="w-full h-20 rounded-lg bg-transparent border border-border p-2.5 text-sm focus:border-primary text-foreground resize-none outline-none read-only:text-muted-foreground"
            />
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                value={scene.shotType ?? ""}
                readOnly={readOnly || scene.locked}
                onChange={(e) => patchScene(scene.id, { shotType: e.target.value })}
                placeholder={t("project.shotType")}
                className="rounded-lg bg-transparent border border-border px-2.5 h-9 text-sm focus:border-primary text-foreground outline-none"
              />
              <input
                value={scene.cameraMove ?? ""}
                readOnly={readOnly || scene.locked}
                onChange={(e) => patchScene(scene.id, { cameraMove: e.target.value })}
                placeholder={t("project.cameraMove")}
                className="rounded-lg bg-transparent border border-border px-2.5 h-9 text-sm focus:border-primary text-foreground outline-none"
              />
              <input
                value={scene.mood ?? ""}
                readOnly={readOnly || scene.locked}
                onChange={(e) => patchScene(scene.id, { mood: e.target.value })}
                placeholder={t("project.mood")}
                className="rounded-lg bg-transparent border border-border px-2.5 h-9 text-sm focus:border-primary text-foreground outline-none"
              />
            </div>

            {/* Bible — which recurring elements apply to this scene */}
            {bibles.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{t("project.bible.appliesTo")}</span>
                {bibles.map((b) => {
                  const selected = scene.bibleIds ? scene.bibleIds.includes(b.id) : true;
                  return (
                    <button
                      key={b.id}
                      onClick={() => toggleSceneBible(scene.id, b.id)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2 h-6 text-xs transition-colors cursor-pointer ${
                        selected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground/60 hover:text-foreground"
                      }`}
                    >
                      {bibleIcon(b.type)}
                      {b.name.trim() || t(`project.bible.${b.type}`)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Prompt */}
            {scene.warnings && scene.warnings.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {scene.warnings.map((w) => (
                  <div
                    key={w}
                    className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-muted-foreground"
                  >
                    <IconAlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                    <span>{t(`convert.warn.${w}`)}</span>
                  </div>
                ))}
              </div>
            )}

            {scene.prompt && (
              <div
                className={`mt-3 rounded-lg border bg-background p-3 ${
                  isPromptStale(scene, bibles, project.targetModel, project.inputMode)
                    ? "border-amber-500/50"
                    : "border-border"
                }`}
              >
                {/* A prompt is a snapshot. Once the scene, its Bible entries or
                    the target model move on, saying nothing would let someone
                    copy wording that no longer matches the project. */}
                {isPromptStale(scene, bibles, project.targetModel, project.inputMode) && (
                  <p className="mb-2 flex items-start gap-1.5 text-amber-600 text-xs dark:text-amber-400">
                    <IconAlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>{t("project.promptStale")}</span>
                  </p>
                )}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("project.promptFor", {
                      model: MODEL_REGISTRY.find((m) => m.id === scene.promptModel)?.name ?? "",
                    })}
                  </span>
                  <button
                    onClick={() => copy(scene.id, scene.prompt!)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    {copiedId === scene.id ? (
                      <><IconCheck className="size-3.5 text-green-500" /> {t("common.copied")}</>
                    ) : (
                      <><IconCopy className="size-3.5" /> {t("common.copy")}</>
                    )}
                  </button>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{scene.prompt}</p>
              </div>
            )}

            {!readOnly && (
            <div className="mt-3">
              <button
                onClick={() => generatePrompt(scene)}
                disabled={
                  promptLoadingId !== null ||
                  batchLoading ||
                  !scene.description.trim() ||
                  scene.locked
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 h-9 text-sm text-foreground hover:bg-primary/10 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {promptLoadingId === scene.id ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconWand className="size-4 text-primary" />
                )}
                {scene.prompt ? t("project.regenerate") : t("project.generatePrompt")}
              </button>
            </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
