# File Upload & Study Materials System

This document outlines the architecture, supported formats, validation pipeline, and viewing/download flows for course and study materials on the platform.

---

## 1. Overview & Supported Formats

Content administrators and teachers can upload study materials, exercise sheets, course packs, and architectural drawings to modules. The upload pipeline supports both single-file and multi-file batch uploads.

### Accepted File Formats

| Category | Extensions | MIME Type | Browser Viewer Support |
|---|---|---|---|
| **Portable Document** | `.pdf` | `application/pdf` | Native in-browser PDF reader with byte-range paging |
| **Raster Images** | `.jpg`, `.jpeg`, `.png`, `.webp` | `image/jpeg`, `image/png`, `image/webp` | Native interactive zoom/pan stage |
| **AutoCAD Drawings** | `.dwg` | `image/vnd.dwg` | Direct Download Stage & header download |
| **AutoCAD Interchange** | `.dxf` | `image/vnd.dxf` | Direct Download Stage & header download |
| **PowerPoint** | `.pptx`, `.ppt` | `application/vnd.openxmlformats-officedocument.presentationml.presentation`, `application/vnd.ms-powerpoint` | Direct Download Stage & header download |
| **Word Documents** | `.docx`, `.doc` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/msword` | Direct Download Stage & header download |
| **Excel Spreadsheets** | `.xlsx`, `.xls` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel` | Direct Download Stage & header download |
| **Archives** | `.zip` | `application/zip` | Direct Download Stage & header download |

---

## 2. Security & Magic-Byte Sniffing

All uploads are stored outside the web root under `STORAGE_ROOT` (`./.storage`), preventing direct URL access or directory transversal. Files are assigned randomized UUID filenames on disk.

To prevent malicious executable uploads masked with harmless extensions (e.g. `malware.pdf`), the system inspects **magic bytes** at the start of the file buffer rather than trusting user-controlled extensions alone:

```typescript
// src/server/storage.ts
export function sniff(buffer: Buffer, declaredName?: string): SniffedType | null
```

1. **PDF**: Verified by `%PDF-` ASCII header (`buffer.subarray(0, 5) === "%PDF-"`).
2. **AutoCAD DWG**: Verified by the AutoCAD version prefix `AC10` in the first 4 bytes (`AC1015`, `AC1018`, `AC1024`, `AC1027`, `AC1032`).
3. **AutoCAD DXF**:
   - Binary DXF: Verified by `AutoCAD Binary DXF\r\n\x1a\x00`.
   - ASCII DXF: Starts with group code zero (`0\nSECTION` / `999\n` comment lines) validated along with `.dxf` extension.
4. **Office Open XML (OOXML - PPTX, DOCX, XLSX)**:
   - Validated as ZIP container magic bytes `PK\x03\x04` (`0x50, 0x4b, 0x03, 0x04`).
   - The declared extension or internal directory structure (`ppt/`, `word/`, `xl/`) determines the document sub-type.
5. **Legacy Microsoft Office (PPT, DOC, XLS)**:
   - Validated by OLE Compound File Binary header `0xD0, 0xCF, 0x11, 0xE0`.
6. **Raster Images (JPEG, PNG, WebP)**:
   - Validated by respective image signatures and processed by `sharp` for web-optimization when `convertImages !== false`.

> [!IMPORTANT]
> `sharp` is strictly applied **only** to raster images (`image/jpeg`, `image/png`, `image/webp`). Non-raster types like `image/vnd.dwg` bypass sharp transformation to preserve original binary data without errors.

---

## 3. Upload Workflows for Content Creators

### A. Multi-File Upload via Full Dialog (`ContentManager.tsx`)
1. In the Admin Content panel (`/admin/content`), select the target module.
2. Click **"More Options"** (or "Add first one").
3. Select Source: **"Uploaded file"**.
4. In the file picker, select **one or multiple files** at once (e.g. hold `Ctrl` or `Shift` to select multiple PDFs, Word documents, or AutoCAD files).
5. Click **"Save"**.
   - If a single file is selected, the custom title entered in the form is used.
   - If multiple files are selected, the first file uses the custom title (if provided), and subsequent files automatically derive clean titles from their filenames (e.g. `TD-01_Planche.dwg` becomes `"TD 01 Planche"`).
   - All files are stored and created in order in the module.

### B. Drag-and-Drop Batch Quick Add (`ResourceQuickAdd.tsx`)
1. In the Admin Content panel, with a module selected, drag one or more files directly into the dashed drop zone at the top of the resources panel.
2. Alternatively, click the drop zone to open the system file picker and select multiple files.
3. Up to 60 files can be uploaded in a single batch.
4. Titles are always derived from the filename here — there is no title, credit, or language field in the drop zone by design. Rename or credit a dropped file afterwards through the pencil icon, which opens the same full dialog described above.

### C. The file input only allows multiple files on **Add**, not **Edit**

The full dialog's file input has `multiple` on when creating a new resource and off when editing one — editing replaces the one file an existing resource already has, it does not add more. The hint text under the field used to say "Multiple files allowed" in both cases, which was wrong and confusing while editing; it is now conditional (`fileHint` / `fileHintMultiple` keys) so it only claims what the field actually does.

---

## 4. Crediting the teacher (`made_by_en` / `_fr` / `_ar`)

Every resource carries an optional, trilingual "Made by" field — the teacher or teachers credited on a cours, TD or TP. Free text, not a foreign key to a user account: most people credited here are not accounts on this platform, and a name is written differently in Latin and Arabic script, so a student reading the Arabic library sees the Arabic spelling rather than a transliteration.

- **Admin form**: a `TriLingualField` under the title field in `ContentManager.tsx`, English optional here (`englishRequired={false}`) unlike every other trilingual field in the app, since a resource nobody attributed is a blank, not a validation error.
- **Batch uploads**: the credit applies to *every* file in a multi-select or drag-drop batch, not only the first — a teacher dropping a semester of their own TDs is crediting all of them. The title still only applies to the first file (the rest derive titles from filenames); the credit does not follow that rule.
- **Editing without touching the field**: the edit form always resubmits whatever is currently in the credit inputs (they're pre-filled), so leaving them untouched preserves the value. Submitting them empty clears the credit — this is consistent with how every other trilingual field on this form already behaves, not special-cased.
- **Student-facing**: shown on the resource row in the library list, in the viewer header (sharing a line with the "N / M" position counter), and on the Direct Download Stage for non-previewable formats.
- **Migration**: `drizzle/0022_resource_made_by.sql`. See the gotcha below before writing another one.

---

## 5. Deleting a resource

"Archive" (the toggle/trash icon on an active row) is a soft delete — sets `archived_at`, the row drops out of every student-facing query but stays in `/admin/trash`. "Delete forever" on an archived row is the one place a real `DELETE` runs, guarded by the unified trash system in `src/server/trash.ts`.

As of this session, purging a resource also removes its file from disk (`deleteStored` in `storage.ts`, called from `purgeFromTrash` after the row-delete transaction commits, not before — a failed row delete must not leave a resource that still resolves but 404s the moment a student opens it). Deletion is best-effort: a file already missing from disk (restored from a backup taken between upload and delete, say) purges the row cleanly instead of throwing.

**This is fixed for resources specifically, and only for resources.** Nothing else in the codebase has ever unlinked an upload — a purged product image, avatar, or receipt still leaves its file on disk today. That gap is real and untouched by this session; it needs the same treatment (`deleteStored` called from the relevant purge/delete path) applied to `products.ts`, avatars, and testimonials before it can be called closed platform-wide.

---

## 6. Student Delivery & Direct Download

When students access study materials in their course library (`/library/[slug]`):

1. **Access & Entitlement Verification**:
   - Requests go to `/api/resource/[id]`.
   - The student must be authenticated and actively entitled to the module's semester/year package.
2. **Inline Display (PDFs and Images)**:
   - PDFs are streamed with HTTP 206 partial range request support.
   - Images are rendered inside an interactive pan & zoom stage.
3. **Direct Download for Non-Previewable Formats (AutoCAD, Office Documents)**:
   - Because browsers cannot natively render `.dwg`, `.dxf`, `.docx`, or `.pptx` inside HTML `<object>` or `<img>` elements, the system automatically presents a **Direct Download Stage**.
   - The stage displays:
     - Document badge (`DWG`, `DXF`, `PPTX`, `DOCX`, `XLSX`)
     - Clean format label (e.g. "AutoCAD Drawing", "PowerPoint Presentation")
     - File size (e.g. `14.2 MB`)
     - An informative prompt informing the student to open the file on their device
     - A prominent **"Download"** button
4. **Header Download Button**:
   - For all non-previewable files and any file where `allowDownload` is enabled, a direct download icon/button is always accessible in the top viewer bar.
5. **Content-Disposition**:
   - `/api/resource/[id]` automatically sets `Content-Disposition: attachment` when `allowDownload` is enabled, when `?download=1` is provided, or when the file is not inline previewable in the browser.

---

## 7. File Size Limits

| Resource Type | Maximum Allowed Size |
|---|---|
| Course & Library Resources (`MAX_RESOURCE_BYTES`) | **200 MB** per file |
| Bank Receipts (`MAX_RECEIPT_BYTES`) | **8 MB** per file |
| Profile Avatars (`MAX_AVATAR_BYTES`) | **5 MB** per file |

> [!IMPORTANT]
> `MAX_RESOURCE_BYTES` (`storage.ts`) is **binary** MB: `200 * 1024 * 1024` = 209,715,200 bytes. `next.config.ts`'s `experimental.serverActions.bodySizeLimit` is parsed by the `bytes` package as **decimal** MB. It was set to `"200mb"` (200,000,000 bytes) — about 9.7 MB *smaller* than the app's own cap — so a file the app would call "under 200 MB" and accept could exceed Next's raw request-body limit first. That limit is enforced before the Server Action runs, so the failure never reaches `storeUpload`'s friendly "too large" message; it surfaces as Next's own multipart parser throwing `Unexpected end of form`, an unhandled 500. Fixed by raising the config to `"220mb"`, comfortably above the real per-file cap with room for multipart overhead on a batch. **Any future change to `MAX_RESOURCE_BYTES` must keep `bodySizeLimit` above it in decimal bytes**, or this regresses silently — nothing currently asserts the relationship between the two numbers.

---

## 8. Maintenance & Verification

```bash
npx vitest run tests/storage.test.ts tests/content-actions.test.ts tests/trash.test.ts
```

- `tests/storage.test.ts` — every magic-byte sniff case (PDF, AutoCAD DWG/DXF, Word, PowerPoint, Excel, legacy Office, and executable rejection).
- `tests/content-actions.test.ts` — `saveResourceAction` and `bulkAddResourcesAction` end to end against a real database: multi-file creates one row per file, the credit field survives create/edit/batch/clear, editing without a replacement file keeps the existing one.
- `tests/trash.test.ts` — archive/restore/purge, including that purging a resource removes its file from disk and that a resource whose file is already gone still purges.

### Not verified this session

The multi-file and credit-field server logic above is covered by real tests against a real database — that much is solid. What is **not** independently confirmed is a full click-through of the admin UI in a live, logged-in browser: this session had no working admin session in either the sandboxed browser tool or Claude in Chrome, so the dialog, the drop zone, and the download stage were reviewed by reading the code and exercising the actions directly, not by clicking them. If something still looks off in the browser after restarting `npm run dev` (required for the `next.config.ts` change to take effect), that is the most likely place a gap remains.
