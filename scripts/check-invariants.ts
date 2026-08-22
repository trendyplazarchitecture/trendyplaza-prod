import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * The file-shaped rows of the enforcement table in `_AI_CONTEXT/01_RULES.md`.
 *
 * The rest of that table is wired into tools: ESLint holds the delete ban, the
 * import boundary and the directional-utility ban, Stylelint holds the
 * directional-property ban, `check:i18n` holds message-key parity, and
 * `tsc --noEmit` holds `any`. What is left are four facts about the working
 * tree that no linter has an opinion about.
 *
 * Blocking in CI. Run with `npm run check:invariants`.
 */

const root = path.resolve(import.meta.dirname, "..");

type Check = { name: string; why: string; failed: () => string | null };

const checks: Check[] = [
  {
    name: "no middleware.ts",
    why: "Next.js 16 runs proxy.ts. A middleware.ts file is never executed, so anything put in it silently does not run, including a check somebody believed was protecting a route.",
    failed: () => {
      const found = ["middleware.ts", "src/middleware.ts", "app/middleware.ts"]
        .filter((p) => existsSync(path.join(root, p)));
      return found.length ? `found ${found.join(", ")}` : null;
    },
  },
  {
    name: "uploads are not public",
    why: "Receipts and resource files live outside the web root, under STORAGE_ROOT. Anything under public/ is served at a guessable URL with no entitlement check in front of it.",
    failed: () => {
      const forbidden = ["public/uploads", "public/.storage", "public/resources", "public/receipts"]
        .filter((p) => existsSync(path.join(root, p)));
      return forbidden.length ? `found ${forbidden.join(", ")}` : null;
    },
  },
  {
    name: "no environment file committed",
    why: "A filled .env carries the database password and BETTER_AUTH_SECRET. Rotating a leaked secret signs every student out.",
    failed: () => {
      const found = [".env", ".env.local", ".env.production"]
        .filter((p) => tracked(p));
      return found.length ? `${found.join(", ")} is tracked by git` : null;
    },
  },
  {
    name: "every migration is committed",
    why: "A schema change that exists only in TypeScript applies on nobody's machine and on no server. Every change is a versioned SQL file in drizzle/.",
    failed: () => {
      const dir = path.join(root, "drizzle");
      if (!existsSync(dir)) return "drizzle/ is missing";
      const sql = readdirSync(dir).filter((f) => f.endsWith(".sql"));
      if (sql.length === 0) return "drizzle/ holds no .sql migration";
      const journal = path.join(dir, "meta", "_journal.json");
      if (!existsSync(journal)) return "drizzle/meta/_journal.json is missing";
      return null;
    },
  },
];

/** Untracked is the normal state for these. Only a tracked one is the failure. */
function tracked(relative: string): boolean {
  // `git ls-files` is the only reliable answer: the file existing locally is
  // expected and says nothing about what is in the repository.
  try {
    const out = execFileSync("git", ["ls-files", "--", relative], {
      cwd: root,
      encoding: "utf8",
    });
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

let failures = 0;
for (const check of checks) {
  const reason = check.failed();
  if (reason) {
    failures++;
    console.error(`✖ ${check.name}: ${reason}`);
    console.error(`  ${check.why}\n`);
  } else {
    console.log(`✓ ${check.name}`);
  }
}

if (failures > 0) {
  console.error(`${failures} invariant${failures === 1 ? "" : "s"} broken. See _AI_CONTEXT/01_RULES.md.`);
  process.exit(1);
}
