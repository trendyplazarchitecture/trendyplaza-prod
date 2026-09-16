import { config } from "dotenv";

/**
 * Next.js reads `.env.local` and dotenv does not, so scripts run outside the
 * Next process (seed, migrations, tests) would otherwise see a different
 * environment than the app. Same precedence Next uses: local wins.
 */
config({ path: [".env.local", ".env"], quiet: true });
