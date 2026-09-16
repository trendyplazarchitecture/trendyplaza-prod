import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
} from "drizzle-orm/pg-core";
import { RESTRICT } from "./_shared";

/**
 * 69 wilayas since Loi 26-06, April 2026. The count is never hard-coded in
 * application code; read it from this table.
 */
export const wilayas = pgTable("wilayas", {
  code: integer().primaryKey(),
  nameFr: text().notNull(),
  nameAr: text().notNull(),
});

export const communes = pgTable(
  "communes",
  {
    id: serial().primaryKey(),
    wilayaCode: integer()
      .notNull()
      .references(() => wilayas.code, RESTRICT),
    nameFr: text().notNull(),
    nameAr: text().notNull(),
  },
  (t) => [index("communes_wilaya_idx").on(t.wilayaCode, t.nameFr)],
);

/**
 * Maintained by the admin. Prices in DZD centimes like every other money
 * column, so 900 DA is 90000.
 */
export const shippingRates = pgTable("shipping_rates", {
  wilayaCode: integer()
    .primaryKey()
    .references(() => wilayas.code, RESTRICT),
  homeDzd: integer().notNull(),
  deskDzd: integer().notNull(),
  isAvailable: boolean().notNull().default(true),
  noteEn: text(),
  noteFr: text(),
  noteAr: text(),
});
