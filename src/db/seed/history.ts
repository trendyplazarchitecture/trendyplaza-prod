/**
 * Sixty days of plausible trading history.
 *
 * The point is not volume, it is shape. A dashboard tested against three rows
 * looks fine and then falls apart on the client's real data, and a chart fed
 * a flat line teaches you nothing about whether the chart works. So this
 * generates a distribution with the properties the real business has:
 *
 * - Orders cluster in the north. Alger, Oran, Constantine and Blida take most
 *   of them, the Sahara wilayas a handful, which is what the shipping table
 *   already assumes.
 * - Older orders are mostly delivered, recent ones mostly pending. An order
 *   does not stay in the queue for six weeks.
 * - Fridays are quiet. A flat weekday distribution is the tell of fake data.
 *
 * Everything is deterministic from a fixed seed, so two people running the
 * seed see the same numbers and can talk about the same order.
 */

/** Mulberry32. Small, fast, and repeatable, which is the only requirement. */
export function makeRandom(seed = 0x5eed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CUSTOMER_NAMES = [
  "Sofiane Merabet", "Imene Kaci", "Yacine Brahimi", "Meriem Slimani",
  "Abdelkader Rahmani", "Chaima Boudjelal", "Riad Belhadj", "Nour Hamdi",
  "Islam Ferhat", "Assia Guerrouf", "Oussama Nait", "Kenza Aliouat",
  "Mohamed Larbi", "Sarah Ait Ali", "Ilyes Zeghdoud", "Wafa Benkhelifa",
  "Adel Messaoudi", "Hind Terki", "Zakaria Ould Ali", "Selma Bencheikh",
  "Anis Khelil", "Radia Amrani", "Farid Boukhalfa", "Lamia Bousaid",
  "Toufik Draoui", "Amel Chaabane", "Sami Belkhir", "Nawel Ziani",
];

/**
 * Where the orders go, weighted. Codes are wilaya codes, so this survives the
 * commune dataset being replaced.
 */
export const WILAYA_WEIGHTS: [code: number, weight: number][] = [
  [16, 26], // Alger
  [31, 14], // Oran
  [25, 10], // Constantine
  [9, 9],   // Blida
  [6, 7],   // Béjaïa
  [19, 6],  // Sétif
  [15, 5],  // Tizi Ouzou
  [23, 4],  // Annaba
  [5, 4],   // Batna
  [13, 3],  // Tlemcen
  [35, 3],  // Boumerdès
  [2, 2],   // Chlef
  [30, 2],  // Ouargla
  [47, 2],  // Ghardaïa
  [1, 1],   // Adrar
  [11, 1],  // Tamanrasset
  [39, 1],  // El Oued
];

export function pickWeighted(random: () => number): number {
  const total = WILAYA_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
  let roll = random() * total;
  for (const [code, weight] of WILAYA_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return code;
  }
  return WILAYA_WEIGHTS[0][0];
}

/**
 * How far through its life an order of a given age should be.
 * Returns the status and, for the ones that got there, when it was confirmed.
 */
export function statusForAge(
  ageDays: number,
  random: () => number,
): "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "returned" {
  const roll = random();

  if (ageDays <= 1) {
    return roll < 0.75 ? "pending" : "confirmed";
  }
  if (ageDays <= 3) {
    if (roll < 0.18) return "pending";
    if (roll < 0.45) return "confirmed";
    if (roll < 0.7) return "packed";
    return "shipped";
  }
  if (ageDays <= 7) {
    if (roll < 0.06) return "pending";
    if (roll < 0.2) return "shipped";
    if (roll < 0.9) return "delivered";
    return "cancelled";
  }
  // Anything older has finished one way or another.
  if (roll < 0.88) return "delivered";
  if (roll < 0.97) return "cancelled";
  return "returned";
}

/** Fridays are the weekend in Algeria, so volume drops. */
export function ordersOnDay(date: Date, random: () => number): number {
  const isFriday = date.getDay() === 5;
  const base = isFriday ? 0.6 : 2.6;
  const spread = isFriday ? 1 : 3;
  return Math.max(0, Math.round(base + random() * spread - 0.5));
}

export const CANCEL_REASONS = [
  "Customer did not answer after three calls",
  "Customer changed their mind on the call",
  "Wrong address, could not be corrected",
  "Out of stock at packing",
];
