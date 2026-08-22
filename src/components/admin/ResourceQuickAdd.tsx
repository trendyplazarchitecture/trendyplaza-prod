"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileUp, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { bulkAddResourcesAction } from "@/server/actions/content";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ResourceType = { id: string; key: string; labelEn: string };

/**
 * A folder of scans, dropped once, renamed afterwards — the one thing the
 * "Add a resource" dialog cannot do, since that dialog is one resource with
 * full fields (a YouTube link, Arabic and French titles, the download flag)
 * per submission. This used to also carry a single-file inline form, which
 * the dialog already covered end to end; that half was dead weight and was
 * removed rather than kept as a second way to do the same thing.
 */
export function ResourceQuickAdd({
  moduleId,
  resourceTypes,
}: {
  moduleId: string;
  resourceTypes: ResourceType[];
}) {
  const t = useTranslations("admin.resourceQuickAdd");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [typeId, setTypeId] = useState(resourceTypes[0]?.id ?? "");
  const [dragging, setDragging] = useState(false);
  const bulkRef = useRef<HTMLInputElement>(null);

  function addMany(files: FileList | null) {
    if (!files || files.length === 0) return;

    const form = new FormData();
    form.set("moduleId", moduleId);
    form.set("resourceTypeId", typeId);
    for (const file of Array.from(files)) form.append("files", file);

    startTransition(async () => {
      const result = await bulkAddResourcesAction(form);
      if (result.ok) {
        toast.success(result.message);
        if (bulkRef.current) bulkRef.current.value = "";
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-3 border-b border-rule bg-paper/60 p-4">
      <Select value={typeId} onValueChange={setTypeId}>
        <SelectTrigger className="h-9 w-[8.5rem]" aria-label={t("resourceTypeLabel")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {resourceTypes.map((rt) => (
            <SelectItem key={rt.id} value={rt.id}>
              {rt.labelEn}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addMany(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-3 text-xs transition-colors",
          dragging
            ? "border-primary bg-primary/5 text-primary"
            : "border-border text-muted-foreground hover:border-primary/50",
        )}
      >
        <input
          ref={bulkRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => addMany(e.target.files)}
        />
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : dragging ? (
          <FileUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <UploadCloud className="h-4 w-4" aria-hidden="true" />
        )}
        <span>{dragging ? t("dropHere") : t("dropHint")}</span>
      </label>
    </div>
  );
}
