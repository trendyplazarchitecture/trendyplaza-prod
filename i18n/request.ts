import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import fs from "node:fs";
import path from "node:path";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  try {
    const filePath = path.join(process.cwd(), "messages", `${locale}.json`);
    const fileContent = fs.readFileSync(filePath, "utf8");
    return {
      locale,
      messages: JSON.parse(fileContent),
    };
  } catch {
    return {
      locale,
      messages: (await import(`../messages/${locale}.json`)).default,
    };
  }
});
