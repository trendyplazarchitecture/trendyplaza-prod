"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Calendar,
  Check,
  Download,
  Eye,
  EyeOff,
  Globe,
  ImageIcon,
  ImagePlus,
  Instagram,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Megaphone,
  Newspaper,
  Pencil,
  Plus,
  RotateCcw,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  archivePostAction,
  listEventRegistrationsAction,
  purgePostAction,
  reorderPostsAction,
  restorePostAction,
  savePostAction,
  setPostActiveAction,
  updateAttendeeStatusAction,
  type ActionResult,
} from "@/server/actions/posts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { TriLingualField } from "./TriLingual";
import { postCoverImageUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type PostRow = {
  id: string;
  kind: "announcement" | "event" | "news";
  slug: string | null;
  titleEn: string;
  titleFr: string | null;
  titleAr: string | null;
  bodyEn: string;
  bodyFr: string | null;
  bodyAr: string | null;
  coverImagePath: string | null;
  galleryImages: string[];
  instagramUrl: string | null;
  externalUrl: string | null;
  registrationUrl: string | null;
  allowRegistration: boolean;
  maxAttendees: number | null;
  audience: "all" | "students" | "on_hold";
  startsAt: Date | null;
  endsAt: Date | null;
  locationEn: string | null;
  locationFr: string | null;
  locationAr: string | null;
  isOnline: boolean;
  isActive: boolean;
  position: number;
  archivedAt: Date | null;
  createdAt: Date;
  registrationCount?: number;
};

type AttendeeRow = {
  id: string;
  postId: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string;
  university: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
};

type GalleryItem = {
  id: string;
  type: "existing" | "staged";
  path?: string;
  file?: File;
  previewUrl: string;
};

export function PostsManager({ rows }: { rows: PostRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filterKind, setFilterKind] = useState<"all" | "announcement" | "event" | "news">("all");
  
  const activeRows = rows.filter((r) => !r.archivedAt);
  const archivedRows = rows.filter((r) => r.archivedAt);

  const displayedActive =
    filterKind === "all"
      ? activeRows
      : activeRows.filter((r) => r.kind === filterKind);

  const displayedArchived =
    filterKind === "all"
      ? archivedRows
      : archivedRows.filter((r) => r.kind === filterKind);

  const [editing, setEditing] = useState<PostRow | "new" | null>(null);
  const [selectedKind, setSelectedKind] = useState<"announcement" | "event" | "news">("announcement");
  const [isOnlineState, setIsOnlineState] = useState(false);
  const [allowRegistrationState, setAllowRegistrationState] = useState(true);

  // Media & Gallery state
  const [coverImagePath, setCoverImagePath] = useState<string | null>(null);
  const [stagedCoverFile, setStagedCoverFile] = useState<File | null>(null);
  const [stagedCoverPreview, setStagedCoverPreview] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const galleryFileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  const [deleting, setDeleting] = useState<PostRow | null>(null);
  const [purging, setPurging] = useState<PostRow | null>(null);

  // Attendees Dialog State
  const [attendeesPost, setAttendeesPost] = useState<PostRow | null>(null);
  const [attendeesList, setAttendeesList] = useState<AttendeeRow[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  function act(fn: () => Promise<ActionResult>) {
    startTransition(async () => {
      try {
        const result = await fn();
        if (result.ok) {
          toast.success(result.message);
          setEditing(null);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  function openEdit(post: PostRow | "new") {
    if (post === "new") {
      setSelectedKind(filterKind === "all" ? "announcement" : filterKind);
      setIsOnlineState(false);
      setAllowRegistrationState(true);
      setCoverImagePath(null);
      setStagedCoverFile(null);
      setStagedCoverPreview(null);
      setGalleryItems([]);
    } else {
      setSelectedKind(post.kind);
      setIsOnlineState(post.isOnline);
      setAllowRegistrationState(post.allowRegistration);
      setCoverImagePath(post.coverImagePath ?? null);
      setStagedCoverFile(null);
      setStagedCoverPreview(null);
      const existingItems: GalleryItem[] = (post.galleryImages ?? []).map((path, idx) => ({
        id: `existing-${idx}-${path}`,
        type: "existing",
        path,
        previewUrl: postCoverImageUrl(path) ?? "",
      }));
      setGalleryItems(existingItems);
    }
    setEditing(post);
  }

  async function openAttendees(post: PostRow) {
    setAttendeesPost(post);
    setLoadingAttendees(true);
    try {
      const data = await listEventRegistrationsAction({ postId: post.id });
      setAttendeesList(data);
    } catch {
      toast.error("Failed to load attendees.");
    } finally {
      setLoadingAttendees(false);
    }
  }

  function updateStatus(registrationId: string, status: "registered" | "attended" | "cancelled") {
    startTransition(async () => {
      try {
        const res = await updateAttendeeStatusAction({ registrationId, status });
        if (res.ok) {
          toast.success(res.message);
          setAttendeesList((prev) =>
            prev.map((a) => (a.id === registrationId ? { ...a, status } : a)),
          );
        } else {
          toast.error(res.message);
        }
      } catch {
        toast.error("Failed to update status.");
      }
    });
  }

  // Cover Image handlers
  function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setStagedCoverFile(file);
      setStagedCoverPreview(URL.createObjectURL(file));
      setCoverImagePath(null);
    }
  }

  function removeCoverImage() {
    setCoverImagePath(null);
    setStagedCoverFile(null);
    if (stagedCoverPreview) {
      URL.revokeObjectURL(stagedCoverPreview);
      setStagedCoverPreview(null);
    }
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = "";
    }
  }

  // Gallery handlers
  function handleGalleryFilesAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: GalleryItem[] = Array.from(files).map((file, idx) => ({
      id: `staged-${Date.now()}-${idx}-${file.name}`,
      type: "staged",
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setGalleryItems((prev) => [...prev, ...newItems]);
    if (galleryFileInputRef.current) {
      galleryFileInputRef.current.value = "";
    }
  }

  function moveGalleryItem(index: number, direction: "left" | "right") {
    const target = direction === "left" ? index - 1 : index + 1;
    if (target < 0 || target >= galleryItems.length) return;

    setGalleryItems((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  }

  function removeGalleryItem(index: number) {
    setGalleryItems((prev) => {
      const item = prev[index];
      if (item.type === "staged" && item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  function setGalleryItemAsCover(item: GalleryItem) {
    if (item.type === "existing" && item.path) {
      setCoverImagePath(item.path);
      setStagedCoverFile(null);
      setStagedCoverPreview(null);
      toast.success("Cover thumbnail updated from gallery image.");
    } else if (item.type === "staged" && item.file) {
      setStagedCoverFile(item.file);
      setStagedCoverPreview(item.previewUrl);
      setCoverImagePath(null);
      toast.success("Cover thumbnail set to newly added photo.");
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (editing && editing !== "new") {
      form.set("id", editing.id);
    }
    form.set("kind", selectedKind);
    form.set("isOnline", String(isOnlineState));
    form.set("allowRegistration", String(allowRegistrationState));

    // Pass final cover image
    if (stagedCoverFile) {
      form.set("coverImage", stagedCoverFile);
      form.delete("coverImagePath");
    } else if (coverImagePath) {
      form.set("coverImagePath", coverImagePath);
      form.delete("coverImage");
    } else {
      form.set("coverImagePath", "");
      form.delete("coverImage");
    }

    // Pass existing gallery images in exact organised order
    const orderedExisting = galleryItems
      .filter((item): item is GalleryItem & { path: string } => item.type === "existing" && !!item.path)
      .map((item) => item.path);
    form.set("existingGalleryImages", JSON.stringify(orderedExisting));

    // Append newly staged gallery files
    form.delete("galleryFiles");
    for (const item of galleryItems) {
      if (item.type === "staged" && item.file) {
        form.append("galleryFiles", item.file);
      }
    }

    act(() => savePostAction(form));
  }

  function moveRow(index: number, direction: "up" | "down") {
    const list = [...displayedActive];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;

    const current = list[index];
    list[index] = list[target];
    list[target] = current;

    act(() =>
      reorderPostsAction({
        kind: selectedKind,
        orderedIds: list.map((r) => r.id),
      }),
    );
  }

  const effectiveCoverPreview = stagedCoverPreview || (coverImagePath ? postCoverImageUrl(coverImagePath) : null);

  return (
    <div className="space-y-6">
      {/* Top Toolbar: Filters on start, New Post button on end (No duplicate h1) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <button
            type="button"
            onClick={() => setFilterKind("all")}
            className={cn(
              "rounded-md px-3 py-1.5 font-semibold transition-colors",
              filterKind === "all"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            All ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterKind("announcement")}
            className={cn(
              "rounded-md px-3 py-1.5 font-semibold transition-colors",
              filterKind === "announcement"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Announcements ({rows.filter((r) => r.kind === "announcement").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterKind("event")}
            className={cn(
              "rounded-md px-3 py-1.5 font-semibold transition-colors",
              filterKind === "event"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Events ({rows.filter((r) => r.kind === "event").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterKind("news")}
            className={cn(
              "rounded-md px-3 py-1.5 font-semibold transition-colors",
              filterKind === "news"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            News ({rows.filter((r) => r.kind === "news").length})
          </button>
        </div>

        <Button onClick={() => openEdit("new")} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span>New Post</span>
        </Button>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Kind / Audience</th>
                <th className="px-4 py-3">Date / Venue</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayedActive.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No active posts found. Click &quot;New Post&quot; to create one.
                  </td>
                </tr>
              ) : (
                displayedActive.map((post, index) => {
                  const coverUrl = postCoverImageUrl(post.coverImagePath);
                  return (
                    <tr key={post.id} className="transition-colors hover:bg-muted/30">
                      {/* Reorder arrows */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={index === 0 || isPending}
                            onClick={() => moveRow(index, "up")}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            aria-label="Move up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === displayedActive.length - 1 || isPending}
                            onClick={() => moveRow(index, "down")}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            aria-label="Move down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Item details */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-paper">
                            {coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={post.titleEn}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                                {post.kind === "announcement" ? (
                                  <Megaphone className="h-5 w-5" />
                                ) : post.kind === "event" ? (
                                  <Calendar className="h-5 w-5" />
                                ) : (
                                  <Newspaper className="h-5 w-5" />
                                )}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-foreground line-clamp-1">
                              {post.titleEn}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {post.slug ? `/${post.kind === "event" ? "events" : "news"}/${post.slug}` : post.bodyEn}
                            </div>
                            {post.galleryImages && post.galleryImages.length > 0 && (
                              <div className="mt-0.5 text-[11px] font-semibold text-primary">
                                +{post.galleryImages.length} gallery photo{post.galleryImages.length === 1 ? "" : "s"}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kind / Audience */}
                      <td className="px-4 py-3 align-middle">
                        <div className="space-y-1">
                          <span className="inline-flex rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-foreground/10 text-foreground">
                            {post.kind}
                          </span>
                          {post.kind === "announcement" && (
                            <div className="text-xs text-muted-foreground">
                              Audience: <strong className="text-foreground">{post.audience}</strong>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Dates & Location */}
                      <td className="px-4 py-3 align-middle text-xs">
                        {post.kind === "event" ? (
                          <div className="space-y-1">
                            {post.startsAt && (
                              <div className="flex items-center gap-1 font-semibold text-foreground">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span>{new Date(post.startsAt).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-muted-foreground">
                              {post.isOnline ? (
                                <>
                                  <Globe className="h-3 w-3" /> Online
                                </>
                              ) : (
                                <>
                                  <MapPin className="h-3 w-3" /> {post.locationEn || "Venue TBA"}
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </td>

                      {/* Active toggle */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={post.isActive}
                            disabled={isPending}
                            onCheckedChange={(checked) =>
                              act(() => setPostActiveAction({ id: post.id, isActive: checked }))
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            {post.isActive ? "Live" : "Draft"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 align-middle text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {post.kind === "event" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openAttendees(post)}
                              className="h-8 gap-1 text-xs"
                            >
                              <Users className="h-3.5 w-3.5 text-primary" />
                              <span>Attendees ({post.registrationCount ?? 0})</span>
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(post)}
                            aria-label="Edit post"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleting(post)}
                            aria-label="Archive post"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Archived Section */}
      {displayedArchived.length > 0 && (
        <div className="space-y-3 pt-6">
          <h2 className="text-lg font-bold text-muted-foreground">
            Archived Posts ({displayedArchived.length})
          </h2>
          <div className="rounded-xl border border-border/80 bg-muted/20 divide-y divide-border">
            {displayedArchived.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 opacity-75 transition-opacity hover:opacity-100"
              >
                <div>
                  <div className="font-semibold text-foreground">{post.titleEn}</div>
                  <div className="text-xs text-muted-foreground">
                    Archived on {post.archivedAt ? new Date(post.archivedAt).toLocaleDateString() : "—"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => act(() => restorePostAction({ id: post.id }))}
                    className="gap-1.5 text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restore</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPurging(post)}
                    className="text-xs text-destructive hover:bg-destructive/10"
                  >
                    Purge
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit / Create Dialog */}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? "Create New Item" : `Edit ${editing?.titleEn}`}
            </DialogTitle>
            <DialogDescription>
              Configure trilingual content, visual media gallery, scheduling, and registration settings.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-6 pt-2">
            {/* Kind Selector */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="kind">Type</Label>
                <Select
                  value={selectedKind}
                  onValueChange={(val: "announcement" | "event" | "news") => setSelectedKind(val)}
                >
                  <SelectTrigger id="kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement (Notice Banner)</SelectItem>
                    <SelectItem value="event">Event / Workshop</SelectItem>
                    <SelectItem value="news">News / Notice Post</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedKind === "announcement" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="audience">Audience</Label>
                  <Select
                    name="audience"
                    defaultValue={editing && editing !== "new" ? editing.audience : "all"}
                  >
                    <SelectTrigger id="audience">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Visitors & Students</SelectItem>
                      <SelectItem value="students">Active Students Only</SelectItem>
                      <SelectItem value="on_hold">On-Hold / Pending Approval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="slug">Custom URL Slug (optional)</Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="e.g. parametric-workshop-2026"
                    defaultValue={editing && editing !== "new" ? editing.slug ?? "" : ""}
                  />
                </div>
              )}
            </div>

            {/* Trilingual Title */}
            <TriLingualField
              name="title"
              label="Title"
              values={{
                En: editing && editing !== "new" ? editing.titleEn : "",
                Fr: editing && editing !== "new" ? editing.titleFr ?? "" : "",
                Ar: editing && editing !== "new" ? editing.titleAr ?? "" : "",
              }}
            />

            {/* Trilingual Body */}
            <TriLingualField
              name="body"
              label="Description / Article Body"
              multiline
              values={{
                En: editing && editing !== "new" ? editing.bodyEn : "",
                Fr: editing && editing !== "new" ? editing.bodyFr ?? "" : "",
                Ar: editing && editing !== "new" ? editing.bodyAr ?? "" : "",
              }}
            />

            {/* Event Specific Scheduling & Venue */}
            {selectedKind === "event" && (
              <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                <h3 className="text-sm font-bold text-foreground">Event Scheduling & Venue</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="startsAt">Start Date & Time</Label>
                    <Input
                      id="startsAt"
                      name="startsAt"
                      type="datetime-local"
                      defaultValue={
                        editing && editing !== "new" && editing.startsAt
                          ? new Date(editing.startsAt).toISOString().slice(0, 16)
                          : ""
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="endsAt">End Date & Time</Label>
                    <Input
                      id="endsAt"
                      name="endsAt"
                      type="datetime-local"
                      defaultValue={
                        editing && editing !== "new" && editing.endsAt
                          ? new Date(editing.endsAt).toISOString().slice(0, 16)
                          : ""
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Switch
                    id="isOnline"
                    checked={isOnlineState}
                    onCheckedChange={setIsOnlineState}
                  />
                  <Label htmlFor="isOnline" className="cursor-pointer font-semibold">
                    Online Event (Webinar / Stream)
                  </Label>
                </div>

                {!isOnlineState && (
                  <TriLingualField
                    name="location"
                    label="Physical Location / Venue"
                    values={{
                      En: editing && editing !== "new" ? editing.locationEn ?? "" : "",
                      Fr: editing && editing !== "new" ? editing.locationFr ?? "" : "",
                      Ar: editing && editing !== "new" ? editing.locationAr ?? "" : "",
                    }}
                  />
                )}

                {/* Event Registration Settings */}
                <div className="border-t border-border pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-foreground">
                        Native In-App Registration
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Allow students and visitors to register directly and view attendees list.
                      </p>
                    </div>
                    <Switch
                      checked={allowRegistrationState}
                      onCheckedChange={setAllowRegistrationState}
                    />
                  </div>

                  {allowRegistrationState && (
                    <div className="space-y-1.5">
                      <Label htmlFor="maxAttendees">Max Attendees Capacity (Optional)</Label>
                      <Input
                        id="maxAttendees"
                        name="maxAttendees"
                        type="number"
                        min="1"
                        placeholder="e.g. 50"
                        defaultValue={
                          editing && editing !== "new" && editing.maxAttendees
                            ? editing.maxAttendees
                            : ""
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Visual Image & Gallery Organiser */}
            <div className="space-y-5 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Cover Thumbnail & Photo Gallery</h3>
                  <p className="text-xs text-muted-foreground">
                    Organise images, reorder gallery photos, or promote any gallery photo to be the primary cover.
                  </p>
                </div>
              </div>

              {/* 1. Cover Thumbnail Section */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Cover Thumbnail
                  </span>
                  {effectiveCoverPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeCoverImage}
                      className="h-7 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 me-1" />
                      <span>Remove cover</span>
                    </Button>
                  )}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-md border border-border bg-paper">
                    {effectiveCoverPreview ? (
                      <img
                        src={effectiveCoverPreview}
                        alt="Cover preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground/60">
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-[11px]">No cover selected</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      onChange={handleCoverFileChange}
                      className="hidden"
                      id="custom-cover-file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload cover image</span>
                    </Button>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Or click <strong>⭐ Set as Cover</strong> on any photo in the gallery below.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Gallery Organiser Section */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Gallery Images ({galleryItems.length})
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Use the arrow buttons to reorder photos in the exact display sequence.
                    </p>
                  </div>

                  <input
                    ref={galleryFileInputRef}
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    onChange={handleGalleryFilesAdd}
                    className="hidden"
                    id="custom-gallery-files-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => galleryFileInputRef.current?.click()}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <ImagePlus className="h-3.5 w-3.5 text-primary" />
                    <span>+ Add Photos</span>
                  </Button>
                </div>

                {galleryItems.length === 0 ? (
                  <div
                    onClick={() => galleryFileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-8 text-center cursor-pointer transition-colors hover:bg-muted/30"
                  >
                    <ImagePlus className="h-7 w-7 text-muted-foreground/50" />
                    <div className="text-xs font-semibold text-foreground">No gallery images added yet.</div>
                    <div className="text-[11px] text-muted-foreground">
                      Click here to select multiple photos for this {selectedKind}.
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {galleryItems.map((item, idx) => {
                      const isItemCover = (item.type === "existing" && item.path === coverImagePath) ||
                        (item.type === "staged" && item.file === stagedCoverFile);

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "group relative flex flex-col justify-between overflow-hidden rounded-lg border bg-paper p-1.5 transition-all shadow-xs",
                            isItemCover ? "border-primary ring-1 ring-primary" : "border-border",
                          )}
                        >
                          {/* Image Thumbnail */}
                          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
                            <img
                              src={item.previewUrl}
                              alt={`Gallery item ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />

                            {/* Position indicator */}
                            <span className="absolute top-1 start-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              #{idx + 1}
                            </span>

                            {isItemCover && (
                              <span className="absolute top-1 end-1 inline-flex items-center gap-0.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow-xs">
                                <Star className="h-2.5 w-2.5 fill-current" /> Cover
                              </span>
                            )}
                          </div>

                          {/* Controls Bar */}
                          <div className="mt-1.5 flex items-center justify-between gap-1 border-t border-border/50 pt-1">
                            {/* Reorder Arrows */}
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveGalleryItem(idx, "left")}
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
                                aria-label="Move left"
                                title="Move left in gallery"
                              >
                                <ArrowLeft className="h-3 w-3 rtl:-scale-x-100" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === galleryItems.length - 1}
                                onClick={() => moveGalleryItem(idx, "right")}
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
                                aria-label="Move right"
                                title="Move right in gallery"
                              >
                                <ArrowRight className="h-3 w-3 rtl:-scale-x-100" />
                              </button>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-0.5">
                              {!isItemCover && (
                                <button
                                  type="button"
                                  onClick={() => setGalleryItemAsCover(item)}
                                  className="rounded p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                  title="Set as Cover Thumbnail"
                                >
                                  <Star className="h-3 w-3" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => removeGalleryItem(idx)}
                                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                title="Remove photo"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Social & External Links */}
            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
              <h3 className="text-sm font-bold text-foreground">External & Social Links</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="instagramUrl" className="flex items-center gap-1.5">
                    <Instagram className="h-3.5 w-3.5 text-primary" />
                    <span>Instagram Link</span>
                  </Label>
                  <Input
                    id="instagramUrl"
                    name="instagramUrl"
                    type="url"
                    placeholder="https://instagram.com/p/..."
                    defaultValue={
                      editing && editing !== "new" ? editing.instagramUrl ?? "" : ""
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="externalUrl" className="flex items-center gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5 text-primary" />
                    <span>External Link / Google Form</span>
                  </Label>
                  <Input
                    id="externalUrl"
                    name="externalUrl"
                    type="url"
                    placeholder="https://forms.gle/... or https://..."
                    defaultValue={
                      editing && editing !== "new"
                        ? editing.externalUrl ?? editing.registrationUrl ?? ""
                        : ""
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Save Post</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Attendees Management Dialog */}
      <Dialog
        open={attendeesPost !== null}
        onOpenChange={(open) => !open && setAttendeesPost(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pe-6">
              <div>
                <DialogTitle>
                  Registered Attendees — {attendeesPost?.titleEn}
                </DialogTitle>
                <DialogDescription>
                  {attendeesList.length} registration(s) received for this event.
                </DialogDescription>
              </div>

              {attendeesPost && (
                <a
                  href={`/api/admin/events/${attendeesPost.id}/export`}
                  download
                  className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV</span>
                </a>
              )}
            </div>
          </DialogHeader>

          <div className="pt-3">
            {loadingAttendees ? (
              <div className="py-12 text-center text-muted-foreground">
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                <p className="mt-2 text-xs">Loading attendees...</p>
              </div>
            ) : attendeesList.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm font-semibold text-foreground">No attendees registered yet.</p>
                <p className="text-xs text-muted-foreground">Registrations submitted from the public event page will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-start text-xs">
                  <thead className="border-b border-border bg-muted/40 font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Attendee</th>
                      <th className="px-3 py-2.5">Contact</th>
                      <th className="px-3 py-2.5">University</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attendeesList.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2 text-muted-foreground">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-bold text-foreground">{a.name}</div>
                          {a.notes && (
                            <div className="text-[11px] text-muted-foreground italic line-clamp-1">
                              &quot;{a.notes}&quot;
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div>{a.phone}</div>
                          <div className="text-muted-foreground text-[11px]">{a.email}</div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {a.university || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={a.status}
                            onValueChange={(val: "registered" | "attended" | "cancelled") =>
                              updateStatus(a.id, val)
                            }
                          >
                            <SelectTrigger className="h-7 text-xs w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="registered">Registered</SelectItem>
                              <SelectItem value="attended">Attended</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete / Archive Confirmation */}
      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this post?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleting?.titleEn}&quot; will be hidden from public and student views. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && act(() => archivePostAction({ id: deleting.id }))}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Purge Confirmation */}
      <AlertDialog open={purging !== null} onOpenChange={(open) => !open && setPurging(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{purging?.titleEn}&quot; from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => purging && act(() => purgePostAction({ id: purging.id }))}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
