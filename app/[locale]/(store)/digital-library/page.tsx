import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/i18n-content";
import { LibraryClient, type LibraryCardItem } from "@/components/site/LibraryClient";
import { UnderMaintenance } from "@/components/site/UnderMaintenance";
import { getCurrentUser } from "@/server/session";
import { hasAnyAccess } from "@/server/entitlements";
import { isSectionUnderMaintenance } from "@/server/maintenance";
import { listLibraryCategories, listLibraryItems, listLibraryTags } from "@/server/library-items";

/**
 * Launched. Linked from `SiteHeader.tsx`'s "Other" dropdown and the
 * portal's `nav-items.ts`. See NextPhase/UNCOMMITTED_FEATURES_HOLD.md for
 * the build history.
 *
 * `/digital-library`, not `/library` — that slug is the live university
 * tree (`content.ts`/`library.ts`, portal nav, module links). Confirmed
 * explicitly rather than assumed: the existing tree keeps its URL exactly
 * as it is, and this new section gets its own. See `03-library/PLAN.md`
 * §6 for the original reasoning against reusing `/library`.
 *
 * Checked ahead of everything else: `section_maintenance`
 * (`src/lib/maintenance.ts`), same as Software Hub. A signed-in staff
 * member holding `library.manage` still sees the page live, so they are
 * not staring at their own "Under maintenance" screen while checking a
 * change.
 *
 * **Reachable while signed out, unlike the redirect-only Software Hub**:
 * a signed-out visitor still gets the real page — the shelves render,
 * blurred, behind a join CTA — rather than bouncing straight to `/login`.
 * The catalogue itself is not secret (an admin already chose what's
 * visible here); what a signed-out visitor cannot do is open anything,
 * gated or not, which the blur communicates before they even try. Signed
 * in, gating is mixed per item (§7 of the plan): an active entitlement is
 * not required to open an ungated item, only a session is.
 */

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "resourcesPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function DigitalLibraryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  const bypassesMaintenance = user?.permissions.has("library.manage") ?? false;
  if (!bypassesMaintenance && (await isSectionUnderMaintenance("digital-library"))) {
    return <UnderMaintenance />;
  }

  const [rows, categories, allTags, entitled] = await Promise.all([
    listLibraryItems(locale),
    listLibraryCategories(locale),
    listLibraryTags(locale),
    user ? hasAnyAccess(user.id) : Promise.resolve(false),
  ]);

  const items: LibraryCardItem[] = rows.map((row) => ({
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
    author: row.author,
    coverImagePath: row.coverImagePath,
    isGated: row.isGated,
    allowDownload: row.allowDownload,
    source: row.source,
    externalUrl: row.externalUrl,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    tags: row.tags,
    // Signed out: nothing opens, gated or not — the blur overlay is the
    // only thing a visitor without a session can interact with.
    canOpen: user ? !row.isGated || entitled : false,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <LibraryClient items={items} categories={categories} allTags={allTags} preview={!user} />
    </div>
  );
}
