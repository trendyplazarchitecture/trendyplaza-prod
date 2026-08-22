/**
 * Regenerates `src/data/wilayas.ts` from the upstream dataset.
 *
 *   node scripts/build-geo.mjs
 *
 * Source: https://github.com/S450R1/algeria-cities-2025
 * 69 wilayas and 1,541 communes, post Loi 26-06 of April 2026.
 *
 * The generated file is the seed's input, not a runtime import. It is 160 KB,
 * so a client component that imports it ships 160 KB to a phone on mobile
 * data. Wilayas reach the browser as props (69 rows) and communes are fetched
 * per wilaya from the server.
 */
import { writeFileSync, statSync } from "node:fs";

const SOURCE =
  "https://raw.githubusercontent.com/S450R1/algeria-cities-2025/main/json/cities.json";

/**
 * Em dashes, en dashes and horizontal bars are banned by the copy rules in
 * `_AI_CONTEXT/01_RULES.md`, and a dataset becomes copy the moment it reaches
 * a dropdown at checkout. Runs of whitespace collapse for the same reason.
 */
function clean(value) {
  return String(value)
    .replace(/[–—―]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

const response = await fetch(SOURCE);
if (!response.ok) {
  throw new Error(`Could not fetch the dataset: ${response.status}`);
}
const data = await response.json();

const wilayas = data.wilayas.map((w) => ({
  id: w.wilaya_id,
  name: clean(w.wilaya_name_latin),
  nameAr: clean(w.wilaya_name_arabic),
}));

const communes = data.communes.map((c) => ({
  id: c.commune_id,
  wilayaId: c.wilaya_id,
  name: clean(c.commune_name_latin),
  nameAr: clean(c.commune_name_arabic),
}));

// The count is asserted here, in the generator, and nowhere else. Application
// code reads it from the table.
if (wilayas.length !== 69) {
  throw new Error(`Expected 69 wilayas, the source gave ${wilayas.length}`);
}
const orphans = communes.filter((c) => !wilayas.some((w) => w.id === c.wilayaId));
if (orphans.length > 0) {
  throw new Error(`${orphans.length} communes point at a wilaya that does not exist`);
}

const header = `/**
 * Algeria: ${wilayas.length} wilayas and ${communes.length.toLocaleString("en")} communes, post Loi 26-06 of April 2026.
 *
 * Generated from ${SOURCE.replace("https://raw.githubusercontent.com/", "https://github.com/").replace("/main/json/cities.json", "")}
 * by scripts/build-geo.mjs. Do not hand-edit: rerun the script.
 *
 * Latin names carry no em dashes, en dashes or horizontal bars. The copy rules
 * ban them, and a dataset becomes copy the moment it reaches a dropdown.
 *
 * Shipping prices do NOT live here. They are per wilaya, editable by the
 * client, and read from the shipping_rates table.
 *
 * 160 KB. Seed input, not a runtime import: a client component that imports
 * this ships all of it to a phone on mobile data.
 */

export type Wilaya = { id: number; name: string; nameAr: string };
export type Commune = { id: number; wilayaId: number; name: string; nameAr: string };

export const wilayas: Wilaya[] = ${JSON.stringify(wilayas, null, 2)};

export const communes: Commune[] = ${JSON.stringify(communes, null, 2)};

export function getCommunesByWilaya(wilayaId: number): Commune[] {
  return communes.filter((c) => c.wilayaId === wilayaId);
}
`;

writeFileSync("src/data/wilayas.ts", header);

const kb = Math.round(statSync("src/data/wilayas.ts").size / 1024);
console.log(
  `src/data/wilayas.ts: ${wilayas.length} wilayas, ${communes.length} communes, ${kb} KB`,
);
