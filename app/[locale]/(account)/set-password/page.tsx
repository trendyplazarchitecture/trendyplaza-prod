import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { SetPasswordForm } from "@/components/account/SetPasswordForm";
import type { Locale } from "@/lib/i18n-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Choose a password",
  // Never indexed: the URL carries a single-use credential.
  robots: { index: false, follow: false },
};

/**
 * Where an account invite is redeemed. Decision D2.
 *
 * The token is only read here and handed to the action; it is never resolved
 * on this page. Looking the invite up server-side to greet the person by name
 * would mean a valid-looking page for a real token and a different one for a
 * bad token, which is an oracle telling anyone guessing which tokens exist.
 */
export default async function SetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { token } = await searchParams;

  return (
    <div className="w-full max-w-md">
      {token ? (
        <SetPasswordForm token={token} />
      ) : (
        <div className="sheet-ticks rounded-xl border border-rule bg-card p-6">
          <h1 className="text-lg font-bold">This link is incomplete</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Open the link exactly as it was sent to you, or ask for a new one.
          </p>
        </div>
      )}
    </div>
  );
}
