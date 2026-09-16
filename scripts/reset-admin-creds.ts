import "./load-env";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { createDb, schema } from "../src/db/client";
import { PERMISSIONS, PRESETS } from "../src/lib/permissions";
import { randomUUID } from "node:crypto";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set.");

const { db, close } = createDb(url, { max: 1 });

async function upsertStaff(email: string, name: string, passwordRaw: string, permissions: readonly string[]) {
  const [existingUser] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;

    const [existingAccount] = await db
      .select()
      .from(schema.accounts)
      .where(eq(schema.accounts.userId, userId))
      .limit(1);

    const hashed = await hashPassword(passwordRaw);

    if (existingAccount) {
      await db
        .update(schema.accounts)
        .set({ password: hashed })
        .where(eq(schema.accounts.id, existingAccount.id));
    } else {
      await db.insert(schema.accounts).values({
        id: randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: hashed,
      });
    }

    await db
      .update(schema.userProfiles)
      .set({ state: "active", archivedAt: null, archivedBy: null })
      .where(eq(schema.userProfiles.userId, userId));
  } else {
    userId = randomUUID();
    await db.insert(schema.users).values({
      id: userId,
      name,
      email,
      emailVerified: true,
    });

    const hashed = await hashPassword(passwordRaw);
    await db.insert(schema.accounts).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashed,
    });

    await db.insert(schema.userProfiles).values({
      userId,
      fullName: name,
      locale: "fr",
      state: "active",
    });
  }

  for (const permission of permissions) {
    await db
      .insert(schema.userPermissions)
      .values({
        userId,
        permission,
      })
      .onConflictDoNothing();
  }
}

async function main() {
  // Set superadmin with password "password123" AND keep dev@trendy.site with "TpDev!2026" and also create admin@trendy.site with "password123"
  await upsertStaff("dev@trendy.site", "Salah Eddine", "TpDev!2026", PERMISSIONS);
  await upsertStaff("admin@trendy.site", "Omar Latreche", "password123", PERMISSIONS);
  await upsertStaff("content@trendy.site", "Nesrine Haddad", "password123", PRESETS.moderator);
  await upsertStaff("mod1@trendy.site", "Bilal Zerrouki", "password123", PRESETS.order_handler);

  console.log("\n=================================");
  console.log("TEST CREDENTIALS CONFIGURED:");
  console.log("1. admin@trendy.site   / password123   (Super Admin - all permissions)");
  console.log("2. dev@trendy.site     / TpDev!2026    (Super Admin - all permissions)");
  console.log("3. content@trendy.site / password123   (Content Moderator)");
  console.log("4. mod1@trendy.site    / password123   (Order Handler)");
  console.log("=================================\n");

  await close();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
