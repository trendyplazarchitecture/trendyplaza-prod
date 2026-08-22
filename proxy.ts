import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Locale routing only.
 *
 * Nothing in this file is an authorisation check and nothing in this file may
 * become one. Pages, server actions and route handlers each call their own
 * `requireUser` / `requirePermission` / `requireEntitlement`.
 * See _AI_CONTEXT/05_SECURITY.md.
 */
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|favicon\\.ico|.*\\..*).*)"],
};
