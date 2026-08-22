import { PERMISSIONS, PRESETS, type Permission } from "@/lib/permissions";

/**
 * Every account the developer and the client need to see the product working.
 *
 * Passwords are fixed rather than random, so a reseed does not invalidate a
 * saved login halfway through a testing session. They are development
 * credentials for a scratch database and they never reach the server: the seed
 * is not wired into any production path, and `.env.local` is git-ignored.
 */
export type SeededAccount = {
  key: string;
  email: string;
  password: string;
  name: string;
  role: "staff" | "student";
  /** Staff only. */
  permissions?: readonly Permission[];
  /** Student only. */
  profile?: {
    phone: string;
    level: "L1" | "L2" | "L3" | "M1" | "M2";
    locale: "en" | "ar" | "fr";
    state: "on_hold" | "active" | "suspended";
    /** Which package they hold, and how they got in. */
    access?: {
      packageKey: "s1-l1" | "annee-l1";
      source: "code" | "request" | "admin";
      status: "active" | "paused" | "expired" | "revoked";
      /** Negative means it already expired that many days ago. */
      expiresInDays: number | null;
    };
    /** A receipt sitting in the review queue. */
    pendingRequest?: { packageKey: "s1-l1" | "annee-l1"; amountDzd: number | null };
    reviewedRequest?: { packageKey: "s1-l1" | "annee-l1"; status: "approved" | "rejected" };
  };
};

export const STAFF: SeededAccount[] = [
  {
    key: "superAdmin",
    email: "dev@trendy.site",
    password: "TpDev!2026",
    name: "Salah Eddine",
    role: "staff",
    // The developer's own account holds everything, including users.manage.
    permissions: PERMISSIONS,
  },
  {
    key: "clientAdmin",
    email: "admin@trendy.site",
    password: "TpAdmin!2026",
    name: "Omar Latreche",
    role: "staff",
    permissions: PRESETS.admin,
  },
  {
    key: "contentMod",
    email: "content@trendy.site",
    password: "TpContent!2026",
    name: "Nesrine Haddad",
    role: "staff",
    // Loads course material. Can publish content, cannot touch an order or a
    // code, which is the whole point of granular permissions.
    permissions: PRESETS.moderator,
  },
  {
    key: "orderMod",
    email: "mod1@trendy.site",
    password: "TpOrders!2026",
    name: "Bilal Zerrouki",
    role: "staff",
    // Works the phone queue. Cannot see students, cannot generate codes.
    permissions: PRESETS.order_handler,
  },
];

export const STUDENTS: SeededAccount[] = [
  {
    key: "studentActive",
    email: "yasmine@trendy.site",
    password: "Etudiant!2026",
    name: "Yasmine Belkacem",
    role: "student",
    profile: {
      phone: "0555112233",
      level: "L1",
      locale: "fr",
      state: "active",
      access: { packageKey: "s1-l1", source: "code", status: "active", expiresInDays: 150 },
    },
  },
  {
    key: "studentOnHold",
    email: "rania@trendy.site",
    password: "Attente!2026",
    name: "Rania Cherif",
    role: "student",
    // The receipt path, mid-flight. This is the account that proves the
    // on-hold screen and the review queue both work.
    profile: {
      phone: "0661445566",
      level: "L1",
      locale: "ar",
      state: "on_hold",
      pendingRequest: { packageKey: "s1-l1", amountDzd: 500000 },
    },
  },
  {
    key: "studentUnderpaid",
    email: "karim@trendy.site",
    password: "Attente!2026",
    name: "Karim Bouzid",
    role: "student",
    // Sent the wrong amount. The review screen flags the mismatch and leaves
    // the decision to a human, which is what the client asked for.
    profile: {
      phone: "0770998877",
      level: "L2",
      locale: "fr",
      state: "on_hold",
      pendingRequest: { packageKey: "annee-l1", amountDzd: 300000 },
    },
  },
  {
    key: "studentApproved",
    email: "amine@trendy.site",
    password: "Etudiant!2026",
    name: "Amine Tabet",
    role: "student",
    profile: {
      phone: "0551234567",
      level: "L1",
      locale: "en",
      state: "active",
      access: { packageKey: "annee-l1", source: "request", status: "active", expiresInDays: 300 },
      reviewedRequest: { packageKey: "annee-l1", status: "approved" },
    },
  },
  {
    key: "studentPaused",
    email: "lina@trendy.site",
    password: "Etudiant!2026",
    name: "Lina Meziane",
    role: "student",
    // Paused by an admin. Proves that pause closes access on the next load.
    profile: {
      phone: "0662223344",
      level: "L3",
      locale: "fr",
      state: "active",
      access: { packageKey: "s1-l1", source: "code", status: "paused", expiresInDays: 90 },
    },
  },
  {
    key: "studentExpired",
    email: "walid@trendy.site",
    password: "Etudiant!2026",
    name: "Walid Saïdi",
    role: "student",
    // Past its date with the status still reading active in the row. Proves
    // expiry is computed at read time rather than by a job that may not run.
    profile: {
      phone: "0553334455",
      level: "M1",
      locale: "ar",
      state: "active",
      access: { packageKey: "s1-l1", source: "code", status: "active", expiresInDays: -12 },
    },
  },
  {
    key: "studentRejected",
    email: "sofia@trendy.site",
    password: "Attente!2026",
    name: "Sofia Benali",
    role: "student",
    profile: {
      phone: "0664445566",
      level: "L2",
      locale: "fr",
      state: "on_hold",
      reviewedRequest: { packageKey: "s1-l1", status: "rejected" },
    },
  },
  {
    key: "studentFresh",
    email: "nadir@trendy.site",
    password: "Attente!2026",
    name: "Nadir Oukaci",
    role: "student",
    // Signed up and did nothing else. The emptiest real state there is.
    profile: { phone: "0557778899", level: "L1", locale: "en", state: "on_hold" },
  },
];

export const ALL_ACCOUNTS = [...STAFF, ...STUDENTS];
