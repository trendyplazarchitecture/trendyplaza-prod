import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * "Every schema change is a versioned SQL migration committed to the repo",
 * from the invariants in CLAUDE.md, enforced rather than trusted.
 *
 * Generation compares `src/db/schema` against the snapshot in `drizzle/meta`.
 * It never connects to a database, so this runs anywhere. If it writes
 * anything, somebody changed a table in TypeScript and shipped it without a
 * migration, and the change would apply on no machine and no server.
 *
 * Checking `git diff` alone would miss the usual case: a brand new `.sql`
 * file, which is untracked and therefore not a diff. `git status --porcelain`
 * sees both.
 */

const root = path.resolve(import.meta.dirname, "..");

function git(...args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

const before = git("status", "--porcelain", "--", "drizzle");
if (before.trim()) {
  console.error("drizzle/ is dirty before generating. Commit or stash first:\n" + before);
  process.exit(1);
}

// The package's own entry point, run by this Node. Not `npx`: on Windows that
// is a `.cmd` shim, and Node 24 refuses to spawn one without a shell, which in
// turn concatenates arguments instead of escaping them.
execFileSync(process.execPath, [path.join(root, "node_modules/drizzle-kit/bin.cjs"), "generate"], {
  cwd: root,
  stdio: "inherit",
});

const after = git("status", "--porcelain", "--", "drizzle");
if (after.trim()) {
  console.error(
    "\n✖ A schema change has no committed migration. `drizzle-kit generate` produced:\n" +
      after +
      "\nCommit the generated SQL. See _AI_CONTEXT/04_DATA.md.",
  );
  process.exit(1);
}

console.log("✓ every schema change has a committed migration");
