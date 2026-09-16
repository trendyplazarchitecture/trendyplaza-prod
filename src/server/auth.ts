import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "@/db";

const googleConfigured =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL:
    process.env.BETTER_AUTH_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://trendyplaza.tech"
      : "http://localhost:3000"),
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "https://trendyplaza.tech",
    "https://www.trendyplaza.tech",
    "http://trendyplaza.tech",
    "http://www.trendyplaza.tech",
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
    ...(process.env.COOLIFY_FQDN ? process.env.COOLIFY_FQDN.split(",").map((d) => d.trim().startsWith("http") ? d.trim() : `https://${d.trim()}`) : []),
  ],

  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    // No mail service is provisioned before launch. Students verify by
    // redeeming a code or by an admin approving a receipt, which is a stronger
    // signal than a click in an inbox.
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  // Empty until the domain is bought (open item O1); Google will not accept a
  // localhost redirect URI for a production client.
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  databaseHooks: {
    user: {
      create: {
        // A student who just signed up has no entitlement. `on_hold` is that
        // state, and it is a real screen, not an error.
        after: async (user) => {
          await db
            .insert(schema.userProfiles)
            .values({ userId: user.id, fullName: user.name, state: "on_hold" })
            .onConflictDoNothing();
        },
      },
    },
  },

  plugins: [nextCookies()],
});

export type Auth = typeof auth;
