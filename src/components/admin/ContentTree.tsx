"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Archive,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

import {
  archiveAction,
  restoreAction,
  saveModuleAction,
  saveSemesterAction,
  saveUniversityAction,
  saveYearAction,
  setVisibilityAction,
  type ActionResult,
} from "@/server/actions/content";
import { purgeFromTrashAction, type TrashEntity } from "@/server/actions/trash";
import { StatusPill } from "./StatusPill";
import { Empty } from "./AdminChrome";
import { TriLingualField } from "./TriLingual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type ModuleNode = {
  id: string;
  nameEn: string;
  nameAr: string | null;
  nameFr: string | null;
  isVisible: boolean;
  archived: boolean;
  resourceCount: number;
};

export type SemesterNode = {
  id: string;
  number: number;
  label: string;
  labelEn: string;
  labelAr: string | null;
  labelFr: string | null;
  archived: boolean;
  modules: ModuleNode[];
};

export type YearNode = {
  id: string;
  /** The name as displayed. Was the `L1..M2` enum; now whatever the school calls it. */
  level: string;
  nameEn: string;
  nameAr: string | null;
  nameFr: string | null;
  archived: boolean;
  semesters: SemesterNode[];
};

export type UniversityNode = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string | null;
  nameFr: string | null;
  isVisible: boolean;
  archived: boolean;
  years: YearNode[];
};

/**
 * The content tree.
 *
 * Whoever loads a semester of material does it in one sitting, so the tree
 * expands in place rather than navigating away and back: opening a year, then
 * a semester, then adding four modules, should never cost a page load.
 *
 * Nothing here deletes. Archive sets a date; the row stays, and access that
 * already resolves keeps resolving.
 */
export function ContentTree({
  universities,
  onOpenModule,
}: {
  universities: UniversityNode[];
  onOpenModule: (moduleId: string, name: string) => void;
}) {
  const t = useTranslations("admin.contentTree");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [openUni, setOpenUni] = useState<string | null>(universities[0]?.id ?? null);
  const [openYear, setOpenYear] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [uniDialog, setUniDialog] = useState<UniversityNode | "new" | null>(null);
  const [moduleDialog, setModuleDialog] = useState<
    { semesterId: string; module?: ModuleNode } | null
  >(null);
  // Adding and renaming are one dialog each, carrying either a parent id or
  // the row being renamed. Two dialogs per level would be four more pieces of
  // state saying the same thing.
  const [yearDialog, setYearDialog] = useState<
    { universityId: string; year?: YearNode } | null
  >(null);
  const [termDialog, setTermDialog] = useState<
    { yearId: string; term?: SemesterNode } | null
  >(null);

  function run(key: string, fn: () => Promise<ActionResult>) {
    setBusy(key);
    startTransition(async () => {
      try {
        const result = await fn();
        if (result.ok) {
          toast.success(result.message);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error(t("genericError"));
      } finally {
        setBusy(null);
      }
    });
  }

  const CONTENT_TRASH_ENTITY: Record<
    "university" | "year" | "semester" | "module" | "resource",
    TrashEntity
  > = {
    university: "content_university",
    year: "content_year",
    semester: "content_semester",
    module: "content_module",
    resource: "content_resource",
  };

  const [purgeTarget, setPurgeTarget] = useState<{
    entity: "university" | "year" | "semester" | "module" | "resource";
    id: string;
    label: string;
  } | null>(null);

  function purgeButton(
    entity: "university" | "year" | "semester" | "module" | "resource",
    id: string,
    label: string,
  ) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-primary-press hover:text-primary-press"
        aria-label={t("deleteForever", { name: label })}
        onClick={() => setPurgeTarget({ entity, id, label })}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={() => setUniDialog("new")}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t("newUniversity")}
        </Button>
      </div>

      {universities.length === 0 ? (
        <Empty
          title={t("noUniversitiesTitle")}
          hint={t("noUniversitiesHint")}
          action={
            <Button size="sm" onClick={() => setUniDialog("new")}>
              {t("createFirstOne")}
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {universities.map((uni) => {
            const expanded = openUni === uni.id;

            return (
              <li key={uni.id} className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 px-3 py-3">
                  <button
                    type="button"
                    onClick={() => setOpenUni(expanded ? null : uni.id)}
                    aria-expanded={expanded}
                    className="flex min-w-0 flex-1 items-center gap-2 text-start"
                  >
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 rtl:-scale-x-100",
                        expanded && "rotate-90 rtl:rotate-90",
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{uni.nameEn}</span>
                      <span className="figures block truncate text-xs text-muted-foreground">
                        {uni.slug}
                      </span>
                    </span>
                  </button>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {uni.archived ? (
                      <StatusPill tone="halted">{t("archived")}</StatusPill>
                    ) : !uni.isVisible ? (
                      <StatusPill tone="pending">{t("hidden")}</StatusPill>
                    ) : null}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={t("edit", { name: uni.nameEn })}
                      onClick={() => setUniDialog(uni)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={busy === uni.id && isPending}
                      aria-label={t(uni.isVisible ? "hide" : "show", { name: uni.nameEn })}
                      onClick={() =>
                        run(uni.id, () =>
                          setVisibilityAction({
                            entity: "university",
                            id: uni.id,
                            isVisible: !uni.isVisible,
                          }),
                        )
                      }
                    >
                      {uni.isVisible ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>

                    {/* Archive, never delete. A university carries years,
                        modules, resources and every entitlement pointing at
                        them; removing the row would break all of it silently. */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={busy === uni.id && isPending}
                      aria-label={t(uni.archived ? "restore" : "archive", { name: uni.nameEn })}
                      onClick={() =>
                        run(uni.id, () =>
                          (uni.archived ? restoreAction : archiveAction)({
                            entity: "university",
                            id: uni.id,
                          }),
                        )
                      }
                    >
                      {uni.archived ? (
                        <RotateCcw className="h-3.5 w-3.5" />
                      ) : (
                        <Archive className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    {uni.archived && purgeButton("university", uni.id, uni.nameEn)}
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE_OUT }}
                      className="overflow-hidden border-t border-border"
                    >
                      <ul className="divide-y divide-border">
                        {uni.years.map((year) => {
                          const yearOpen = openYear === year.id;

                          return (
                            <li key={year.id} className={cn(year.archived && "opacity-60")}>
                              <div className="flex items-center gap-1 px-4 py-2 pe-2">
                                <button
                                  type="button"
                                  onClick={() => setOpenYear(yearOpen ? null : year.id)}
                                  aria-expanded={yearOpen}
                                  className="flex min-w-0 flex-1 items-center gap-2 py-0.5 text-start"
                                >
                                  <ChevronRight
                                    className={cn(
                                      "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 rtl:-scale-x-100",
                                      yearOpen && "rotate-90 rtl:rotate-90",
                                    )}
                                    aria-hidden="true"
                                  />
                                  <span className="truncate text-sm font-semibold">
                                    {year.nameEn}
                                  </span>
                                  <span className="figures shrink-0 text-xs text-muted-foreground">
                                    {t("termsAndModules", {
                                      terms: year.semesters.length,
                                      modules: year.semesters.reduce(
                                        (n, s) => n + s.modules.length,
                                        0,
                                      ),
                                    })}
                                  </span>
                                  {year.archived && (
                                    <StatusPill tone="halted">{t("archived")}</StatusPill>
                                  )}
                                </button>

                                <div className="flex shrink-0 items-center gap-0.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    aria-label={t("rename", { name: year.nameEn })}
                                    onClick={() => setYearDialog({ universityId: uni.id, year })}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={busy === year.id && isPending}
                                    aria-label={t(year.archived ? "restore" : "archive", {
                                      name: year.nameEn,
                                    })}
                                    onClick={() =>
                                      run(year.id, () =>
                                        (year.archived ? restoreAction : archiveAction)({
                                          entity: "year",
                                          id: year.id,
                                        }),
                                      )
                                    }
                                  >
                                    {year.archived ? (
                                      <RotateCcw className="h-3.5 w-3.5" />
                                    ) : (
                                      <Archive className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                  {year.archived && purgeButton("year", year.id, year.nameEn)}
                                </div>
                              </div>

                              {yearOpen && (
                                <div className="space-y-3 bg-paper/50 px-4 pb-4">
                                  {year.semesters.map((semester) => (
                                    <div
                                      key={semester.id}
                                      className={cn(semester.archived && "opacity-60")}
                                    >
                                      <div className="flex items-center justify-between gap-2 py-2">
                                        <p className="min-w-0 truncate text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                                          {semester.label}
                                          {semester.archived && ` · ${t("archivedLower")}`}
                                        </p>

                                        <div className="flex shrink-0 items-center gap-0.5">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            aria-label={t("rename", { name: semester.label })}
                                            onClick={() =>
                                              setTermDialog({ yearId: year.id, term: semester })
                                            }
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            disabled={busy === semester.id && isPending}
                                            aria-label={t(
                                              semester.archived ? "restore" : "archive",
                                              { name: semester.label },
                                            )}
                                            onClick={() =>
                                              run(semester.id, () =>
                                                (semester.archived
                                                  ? restoreAction
                                                  : archiveAction)({
                                                  entity: "semester",
                                                  id: semester.id,
                                                }),
                                              )
                                            }
                                          >
                                            {semester.archived ? (
                                              <RotateCcw className="h-3 w-3" />
                                            ) : (
                                              <Archive className="h-3 w-3" />
                                            )}
                                          </Button>
                                          {semester.archived &&
                                            purgeButton("semester", semester.id, semester.label)}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 gap-1 px-2 text-xs"
                                            onClick={() =>
                                              setModuleDialog({ semesterId: semester.id })
                                            }
                                          >
                                            <Plus className="h-3 w-3" aria-hidden="true" />
                                            {t("module")}
                                          </Button>
                                        </div>
                                      </div>

                                      {semester.modules.length === 0 ? (
                                        <p className="rounded border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                                          {t("noModulesYet")}
                                        </p>
                                      ) : (
                                        <ul className="space-y-1.5">
                                          {semester.modules.map((mod) => (
                                            <li
                                              key={mod.id}
                                              className={cn(
                                                "flex items-center gap-2 rounded border border-border bg-card px-3 py-2",
                                                mod.archived && "opacity-60",
                                              )}
                                            >
                                              <button
                                                type="button"
                                                onClick={() => onOpenModule(mod.id, mod.nameEn)}
                                                className="min-w-0 flex-1 text-start"
                                              >
                                                <span className="block truncate text-sm font-medium">
                                                  {mod.nameEn}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                  <FileText className="h-3 w-3" aria-hidden="true" />
                                                  {t("resourceCount", { count: mod.resourceCount })}
                                                  {!mod.nameAr && (
                                                    <span className="text-amber-700">
                                                      · {t("noArabic")}
                                                    </span>
                                                  )}
                                                </span>
                                              </button>

                                              {mod.archived ? (
                                                <>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    aria-label={t("restore", { name: mod.nameEn })}
                                                    onClick={() =>
                                                      run(mod.id, () =>
                                                        restoreAction({
                                                          entity: "module",
                                                          id: mod.id,
                                                        }),
                                                      )
                                                    }
                                                  >
                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                  </Button>
                                                  {purgeButton("module", mod.id, mod.nameEn)}
                                                </>
                                              ) : (
                                                <>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    aria-label={t("edit", { name: mod.nameEn })}
                                                    onClick={() =>
                                                      setModuleDialog({
                                                        semesterId: semester.id,
                                                        module: mod,
                                                      })
                                                    }
                                                  >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    aria-label={t(mod.isVisible ? "hide" : "show", {
                                                      name: mod.nameEn,
                                                    })}
                                                    onClick={() =>
                                                      run(mod.id, () =>
                                                        setVisibilityAction({
                                                          entity: "module",
                                                          id: mod.id,
                                                          isVisible: !mod.isVisible,
                                                        }),
                                                      )
                                                    }
                                                  >
                                                    {mod.isVisible ? (
                                                      <Eye className="h-3.5 w-3.5" />
                                                    ) : (
                                                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                                    )}
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    aria-label={t("archive", { name: mod.nameEn })}
                                                    onClick={() =>
                                                      run(mod.id, () =>
                                                        archiveAction({
                                                          entity: "module",
                                                          id: mod.id,
                                                        }),
                                                      )
                                                    }
                                                  >
                                                    <Archive className="h-3.5 w-3.5" />
                                                  </Button>
                                                </>
                                              )}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  ))}

                                  {/* A school with three terms, or one, says so
                                      here. The number is derived by the action,
                                      so this only ever asks for a name. */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-full gap-1.5 text-xs"
                                    onClick={() => setTermDialog({ yearId: year.id })}
                                  >
                                    <Plus className="h-3 w-3" aria-hidden="true" />
                                    {t("addTermTo", { name: year.nameEn })}
                                  </Button>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>

                      <div className="border-t border-border p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-full gap-1.5 text-xs"
                          onClick={() => setYearDialog({ universityId: uni.id })}
                        >
                          <Plus className="h-3 w-3" aria-hidden="true" />
                          {t("addYear")}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      )}

      {/* University */}
      <Dialog open={uniDialog !== null} onOpenChange={(o) => !o && setUniDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {uniDialog === "new" ? t("newUniversity") : t("editUniversity")}
            </DialogTitle>
            <DialogDescription>
              {uniDialog === "new" ? t("newUniversityDescription") : t("editUniversityDescription")}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const existing = uniDialog !== "new" ? uniDialog : null;
              setUniDialog(null);

              run(existing?.id ?? "new-uni", () =>
                saveUniversityAction({
                  id: existing?.id,
                  slug: String(form.get("slug") ?? ""),
                  nameEn: String(form.get("nameEn") ?? ""),
                  nameAr: (form.get("nameAr") as string) || null,
                  nameFr: (form.get("nameFr") as string) || null,
                  isVisible: existing ? existing.isVisible : true,
                  // Only read on create. The action defaulted it to `lmd` while
                  // this field did not exist, so every school built here was
                  // silently given a Licence/Master ladder.
                  preset: existing
                    ? undefined
                    : (form.get("preset") as "lmd" | "years5" | "empty") || "lmd",
                }),
              );
            }}
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="slug">{t("urlSlug")}</Label>
              <Input
                id="slug"
                name="slug"
                required
                pattern="[a-z0-9\-]+"
                placeholder="epau-algiers"
                defaultValue={uniDialog !== "new" ? uniDialog?.slug : ""}
                className="figures"
              />
            </div>

            {uniDialog === "new" && (
              <fieldset className="space-y-1.5">
                <legend className="text-sm font-medium">{t("startingShape")}</legend>
                <p className="text-xs text-muted-foreground">{t("startingShapeHint")}</p>

                {/*
                  Radios, not a Select. There are three options, each needs a
                  line of explanation, and the whole point of this control is
                  that the person creating a school reads what they are picking
                  — the previous default was invisible and always LMD.
                */}
                <div className="mt-2 space-y-2">
                  {[
                    {
                      value: "lmd",
                      title: t("presetLmdTitle"),
                      hint: t("presetLmdHint"),
                    },
                    {
                      value: "years5",
                      title: t("presetYears5Title"),
                      hint: t("presetYears5Hint"),
                    },
                    {
                      value: "empty",
                      title: t("presetEmptyTitle"),
                      hint: t("presetEmptyHint"),
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-3 transition-colors has-checked:border-primary/50 has-checked:bg-primary/5"
                    >
                      <input
                        type="radio"
                        name="preset"
                        value={option.value}
                        defaultChecked={option.value === "lmd"}
                        className="mt-0.5 accent-primary"
                      />
                      <span>
                        <span className="block text-sm font-medium">{option.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {option.hint}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <TriLingualField
              name="name"
              label={t("nameFieldLabel")}
              values={
                uniDialog !== "new" && uniDialog
                  ? { En: uniDialog.nameEn, Ar: uniDialog.nameAr, Fr: uniDialog.nameFr }
                  : undefined
              }
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUniDialog(null)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Year */}
      <Dialog open={yearDialog !== null} onOpenChange={(o) => !o && setYearDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{yearDialog?.year ? t("renameYear") : t("addYear")}</DialogTitle>
            <DialogDescription>{t("yearNameDescription")}</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const target = yearDialog;
              if (!target) return;
              setYearDialog(null);

              run(target.year?.id ?? "new-year", () =>
                saveYearAction({
                  id: target.year?.id,
                  universityId: target.universityId,
                  nameEn: String(form.get("nameEn") ?? ""),
                  nameAr: (form.get("nameAr") as string) || null,
                  nameFr: (form.get("nameFr") as string) || null,
                }),
              );
            }}
            className="space-y-5"
          >
            <TriLingualField
              name="name"
              label={t("yearNameFieldLabel")}
              values={
                yearDialog?.year
                  ? {
                      En: yearDialog.year.nameEn,
                      Ar: yearDialog.year.nameAr,
                      Fr: yearDialog.year.nameFr,
                    }
                  : undefined
              }
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setYearDialog(null)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Term */}
      <Dialog open={termDialog !== null} onOpenChange={(o) => !o && setTermDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{termDialog?.term ? t("renameTerm") : t("addTerm")}</DialogTitle>
            <DialogDescription>{t("termNameDescription")}</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const target = termDialog;
              if (!target) return;
              setTermDialog(null);

              run(target.term?.id ?? "new-term", () =>
                saveSemesterAction({
                  id: target.term?.id,
                  academicYearId: target.yearId,
                  labelEn: String(form.get("labelEn") ?? ""),
                  labelAr: (form.get("labelAr") as string) || null,
                  labelFr: (form.get("labelFr") as string) || null,
                }),
              );
            }}
            className="space-y-5"
          >
            <TriLingualField
              name="label"
              label={t("termNameFieldLabel")}
              values={
                termDialog?.term
                  ? {
                      En: termDialog.term.labelEn,
                      Ar: termDialog.term.labelAr,
                      Fr: termDialog.term.labelFr,
                    }
                  : undefined
              }
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTermDialog(null)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Module */}
      <Dialog open={moduleDialog !== null} onOpenChange={(o) => !o && setModuleDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{moduleDialog?.module ? t("editModule") : t("newModule")}</DialogTitle>
            <DialogDescription>{t("moduleNameDescription")}</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const target = moduleDialog;
              if (!target) return;
              setModuleDialog(null);

              run(target.module?.id ?? "new-module", () =>
                saveModuleAction({
                  id: target.module?.id,
                  semesterId: target.semesterId,
                  nameEn: String(form.get("nameEn") ?? ""),
                  nameAr: (form.get("nameAr") as string) || null,
                  nameFr: (form.get("nameFr") as string) || null,
                  descriptionEn: (form.get("descriptionEn") as string) || null,
                  descriptionAr: (form.get("descriptionAr") as string) || null,
                  descriptionFr: (form.get("descriptionFr") as string) || null,
                  isVisible: target.module ? target.module.isVisible : true,
                }),
              );
            }}
            className="space-y-5"
          >
            <TriLingualField
              name="name"
              label={t("moduleNameFieldLabel")}
              values={
                moduleDialog?.module
                  ? {
                      En: moduleDialog.module.nameEn,
                      Ar: moduleDialog.module.nameAr,
                      Fr: moduleDialog.module.nameFr,
                    }
                  : undefined
              }
            />

            <TriLingualField
              name="description"
              label={t("descriptionFieldLabel")}
              hint={t("descriptionHint")}
              multiline
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModuleDialog(null)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={purgeTarget !== null} onOpenChange={(open) => !open && setPurgeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteForeverConfirm", { name: purgeTarget?.label ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("purgeRefusesNote")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("keepIt")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!purgeTarget) return;
                const { entity, id } = purgeTarget;
                setPurgeTarget(null);
                run(id, () => purgeFromTrashAction({ entity: CONTENT_TRASH_ENTITY[entity], id }));
              }}
            >
              {t("deleteForeverButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
