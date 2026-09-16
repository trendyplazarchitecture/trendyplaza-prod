import "../scripts/load-env";

/**
 * Tests run against `tp_test`, never the development database. Getting this
 * wrong once wipes the data the client is looking at.
 */
if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL is not set. See .env.example.");
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
