"use client";

import { useEffect, useState } from "react";
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
  IconMovie,
  IconVideo,
  IconPhoto,
  IconUser,
  IconBox,
  IconMapPin,
} from "@tabler/icons-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { MODEL_REGISTRY, type InputMode } from "@/lib/modelRegistry";
import type { BibleType, Project, Scene } from "@/lib/project/types";
import {
  listProjects,
  createProject,
  saveProject,
  deleteProject,
  newSceneId,
  newBibleId,
} from "@/lib/project/store";
import { exportMarkdown, exportJSON, buildBibleContext } from "@/lib/project/export";

const BIBLE_TYPES: BibleType[] = ["character", "object", "location"];

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

  useEffect(() => {
    setMounted(true);
    setProjects(listProjects());
  }, []);

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
          {active ? (
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
}: {
  projects: Project[];
  onNew: () => void;
  onOpen: (p: Project) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <>
      <div className="text-center">
        <h1 className="font-bold text-4xl text-foreground sm:text-5xl">{t("project.title")}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">{t("project.subtitle")}</p>
      </div>

      <div className="mt-10 flex justify-center">
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
}: {
  project: Project;
  onBack: () => void;
  onChange: (p: Project) => void;
}) {
  const { t } = useLanguage();
  const [scenesLoading, setScenesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptLoadingId, setPromptLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scenes = project.scenes.slice().sort((a, b) => a.order - b.order);
  const bibles = project.bibles ?? [];

  function patch(partial: Partial<Project>) {
    onChange({ ...project, ...partial });
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

  function patchScene(id: string, partial: Partial<Scene>) {
    patch({
      scenes: project.scenes.map((s) => (s.id === id ? { ...s, ...partial } : s)),
    });
  }

  function removeScene(id: string) {
    patch({ scenes: project.scenes.filter((s) => s.id !== id) });
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
        body: JSON.stringify({ idea: project.idea.trim() }),
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

  async function generatePrompt(scene: Scene) {
    const sceneText = [
      scene.heading,
      scene.description,
      scene.shotType ? `Shot: ${scene.shotType}` : "",
      scene.cameraMove ? `Camera: ${scene.cameraMove}` : "",
      scene.mood ? `Mood: ${scene.mood}` : "",
    ]
      .filter(Boolean)
      .join(". ");
    if (!sceneText.trim()) return;

    // Prepend the project bible so recurring elements stay consistent per scene.
    const bibleCtx = buildBibleContext(project.bibles);
    const base = bibleCtx ? `${bibleCtx}\n\nScene: ${sceneText}` : sceneText;

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
          warnings: data.results[0].warnings ?? [],
        });
      } else {
        setError(data.message || t("project.errorPrompt"));
      }
    } catch {
      setError(t("common.networkError"));
    } finally {
      setPromptLoadingId(null);
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
        </div>
      </div>

      {/* Title */}
      <input
        value={project.title}
        onChange={(e) => patch({ title: e.target.value })}
        placeholder={t("project.titlePlaceholder")}
        className="mt-6 w-full bg-transparent text-3xl font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
      />

      {/* Idea */}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-2 text-foreground">{t("project.ideaLabel")}</label>
        <textarea
          value={project.idea}
          onChange={(e) => patch({ idea: e.target.value })}
          placeholder={t("project.ideaPlaceholder")}
          maxLength={4000}
          className="w-full h-28 rounded-lg bg-transparent border-2 border-border p-3 text-sm focus:border-primary text-foreground resize-none outline-none"
        />
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
                    onClick={() => removeBible(b.id)}
                    aria-label={t("project.bible.remove")}
                    className="ml-auto inline-flex items-center rounded-lg border border-border p-1.5 text-muted-foreground hover:text-red-500 hover:border-red-500/40 transition-colors cursor-pointer"
                  >
                    <IconTrash className="size-3.5" />
                  </button>
                </div>
                <input
                  value={b.name}
                  onChange={(e) => patchBible(b.id, e.target.value, b.description, b.type)}
                  placeholder={t("project.bible.namePlaceholder")}
                  className="mb-1.5 w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
                />
                <textarea
                  value={b.description}
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
      </div>

      {/* Scenes */}
      <div className="mt-8 space-y-4">
        {scenes.map((scene, i) => (
          <div key={scene.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="font-semibold text-sm text-primary">
                {t("project.scene", { n: i + 1 })}
              </h3>
              <button
                onClick={() => removeScene(scene.id)}
                aria-label={t("project.deleteScene")}
                className="inline-flex items-center rounded-lg border border-border p-1.5 text-muted-foreground hover:text-red-500 hover:border-red-500/40 transition-colors cursor-pointer"
              >
                <IconTrash className="size-3.5" />
              </button>
            </div>

            <input
              value={scene.heading}
              onChange={(e) => patchScene(scene.id, { heading: e.target.value })}
              placeholder={t("project.sceneHeading")}
              className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50 mb-2"
            />
            <textarea
              value={scene.description}
              onChange={(e) => patchScene(scene.id, { description: e.target.value })}
              placeholder={t("project.sceneDescription")}
              className="w-full h-20 rounded-lg bg-transparent border border-border p-2.5 text-sm focus:border-primary text-foreground resize-none outline-none"
            />
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                value={scene.shotType ?? ""}
                onChange={(e) => patchScene(scene.id, { shotType: e.target.value })}
                placeholder={t("project.shotType")}
                className="rounded-lg bg-transparent border border-border px-2.5 h-9 text-sm focus:border-primary text-foreground outline-none"
              />
              <input
                value={scene.cameraMove ?? ""}
                onChange={(e) => patchScene(scene.id, { cameraMove: e.target.value })}
                placeholder={t("project.cameraMove")}
                className="rounded-lg bg-transparent border border-border px-2.5 h-9 text-sm focus:border-primary text-foreground outline-none"
              />
              <input
                value={scene.mood ?? ""}
                onChange={(e) => patchScene(scene.id, { mood: e.target.value })}
                placeholder={t("project.mood")}
                className="rounded-lg bg-transparent border border-border px-2.5 h-9 text-sm focus:border-primary text-foreground outline-none"
              />
            </div>

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
              <div className="mt-3 rounded-lg border border-border bg-background p-3">
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

            <div className="mt-3">
              <button
                onClick={() => generatePrompt(scene)}
                disabled={promptLoadingId === scene.id || !scene.description.trim()}
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
          </div>
        ))}
      </div>
    </>
  );
}
