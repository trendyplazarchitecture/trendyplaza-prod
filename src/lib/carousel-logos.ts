/**
 * `logoPath` on a carousel entry is picked from this fixed list, not typed
 * freely or uploaded. These are the client's own vetted SVGs, copied once
 * into `public/software-logos/` and scanned for embedded scripts before
 * that copy happened — see NextPhase/PROGRESS_TRACKER.md. Accepting
 * arbitrary admin-uploaded SVG would need real sanitization (a stripped-down
 * renderer or a library like DOMPurify's SVG profile) before it could go
 * anywhere near "served to every visitor," and that is out of scope here. A
 * vendor logo not on this list is a request to add one more file to the
 * folder, not a feature gap.
 *
 * Lives outside `actions/software-carousel.ts` on purpose: a `"use server"`
 * file can only export async functions — a plain constant array exported
 * from one resolves to garbage on the client (`.filter is not a function`),
 * not the array.
 */
export const CAROUSEL_LOGO_FILES = [
  { file: "corona-renderer.svg", label: "Corona Renderer" },
  { file: "d5-render.svg", label: "D5 Render" },
  { file: "twinmotion.svg", label: "Twinmotion" },
  { file: "archicad.svg", label: "Archicad" },
  { file: "rhino-3d.svg", label: "Rhino 3D" },
  { file: "v-ray.svg", label: "V-Ray" },
  { file: "enscape.svg", label: "Enscape" },
  { file: "lumion.svg", label: "Lumion" },
  { file: "3ds-max.svg", label: "3ds Max" },
  { file: "sketchup.svg", label: "SketchUp" },
  { file: "revit.svg", label: "Revit" },
  { file: "autocad.svg", label: "AutoCAD" },
  { file: "adobe-indesign.svg", label: "Adobe InDesign" },
  { file: "adobe-illustrator.svg", label: "Adobe Illustrator" },
  { file: "adobe-photoshop.svg", label: "Adobe Photoshop" },
  { file: "unreal-engine.svg", label: "Unreal Engine" },
] as const;
