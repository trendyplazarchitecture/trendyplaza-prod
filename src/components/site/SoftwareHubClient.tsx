"use client";

import { useState } from "react";
import { Check, Copy, GraduationCap, MonitorCog } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { SoftwareDirectory } from "@/server/software";
import type { CarouselLogo } from "@/server/software-carousel";
import { recordSoftwareToolClickAction } from "@/server/actions/software";
import { softwareLogoUrl } from "@/lib/media";
import { LogoCarousel } from "./LogoCarousel";

/**
 * NextPhase/02-software-hub. Every link is copy-to-clipboard, not a plain
 * `<a>` — the client's own instruction: a link here can be a Drive folder
 * or another destination a student needs to paste elsewhere, not always a
 * page worth opening in a new tab on the spot.
 */
function CopyLink({
  url,
  label,
  icon: Icon,
  variant,
  onClick,
}: {
  url: string;
  label: string;
  icon: typeof Copy;
  variant: "primary" | "secondary";
  onClick?: () => void;
}) {
  const t = useTranslations("softwareHubPage");
  const [copied, setCopied] = useState(false);

  async function copy() {
    onClick?.();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("linkCopied"));
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={
        variant === "primary"
          ? "inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-press"
          : "inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground/40"
      }
    >
      {copied ? <Check className="h-3 w-3" aria-hidden="true" /> : <Icon className="h-3 w-3" aria-hidden="true" />}
      {copied ? t("linkCopiedShort") : label}
    </button>
  );
}

export function SoftwareHubClient({
  directory,
  carouselLogos,
  carouselSpeed,
}: {
  directory: SoftwareDirectory;
  carouselLogos: CarouselLogo[];
  carouselSpeed: number;
}) {
  const t = useTranslations("softwareHubPage");
  const shouldReduceMotion = useReducedMotion();
  const { applications, orphanPlugins } = directory;

  function track(toolId: string) {
    void recordSoftwareToolClickAction({ toolId });
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-paper/50 py-14 sm:py-20">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("heroLede")}
            </p>
          </div>
        </div>
      </section>

      <LogoCarousel logos={carouselLogos} speedSeconds={carouselSpeed} />

      <section className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:px-12">
        {applications.length === 0 && orphanPlugins.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <MonitorCog className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <h2 className="mt-3 text-base font-semibold text-foreground">{t("emptyTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("emptyLede")}</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {applications.map((app, index) => {
              const url = softwareLogoUrl(app.logoPath);
              return (
                <motion.div
                  key={app.id}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35, delay: shouldReduceMotion ? 0 : Math.min(index, 6) * 0.05 }}
                  whileHover={shouldReduceMotion ? undefined : { y: -4 }}
                  className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-foreground/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-paper">
                      {url ? (
                        <img src={url} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <MonitorCog className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-foreground">{app.name}</h2>
                  </div>
                  <p className="mt-3 flex-1 text-sm text-muted-foreground">{app.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <CopyLink
                      url={app.officialUrl}
                      label={t("officialSite")}
                      icon={Copy}
                      variant="primary"
                      onClick={() => track(app.id)}
                    />
                    {app.studentLicenseUrl && (
                      <CopyLink
                        url={app.studentLicenseUrl}
                        label={t("studentLicense")}
                        icon={GraduationCap}
                        variant="secondary"
                        onClick={() => track(app.id)}
                      />
                    )}
                  </div>

                  {app.plugins.length > 0 && (
                    <div className="mt-4 space-y-1 border-t border-rule pt-3">
                      <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                        {t("plugins")}
                      </p>
                      {app.plugins.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1">
                          <span className="text-sm text-foreground">{p.name}</span>
                          <CopyLink
                            url={p.officialUrl}
                            label={t("copy")}
                            icon={Copy}
                            variant="secondary"
                            onClick={() => track(p.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/*
              A plugin whose application was hidden or archived on its own.
              `listSoftwareTools` keeps these deliberately rather than
              dropping them, so they have to render somewhere — without this
              they vanish from the hub with no trace, and a catalogue of
              nothing but orphans would draw an empty grid instead of the
              empty state.
            */}
            {orphanPlugins.map((plugin, index) => {
              const url = softwareLogoUrl(plugin.logoPath);
              return (
                <motion.div
                  key={plugin.id}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.35,
                    delay: shouldReduceMotion
                      ? 0
                      : Math.min(applications.length + index, 6) * 0.05,
                  }}
                  whileHover={shouldReduceMotion ? undefined : { y: -4 }}
                  className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-foreground/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-paper">
                      {url ? (
                        <img src={url} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <MonitorCog className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-foreground">{plugin.name}</h2>
                  </div>
                  <p className="mt-3 flex-1 text-sm text-muted-foreground">{plugin.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <CopyLink
                      url={plugin.officialUrl}
                      label={t("officialSite")}
                      icon={Copy}
                      variant="primary"
                      onClick={() => track(plugin.id)}
                    />
                    {plugin.studentLicenseUrl && (
                      <CopyLink
                        url={plugin.studentLicenseUrl}
                        label={t("studentLicense")}
                        icon={GraduationCap}
                        variant="secondary"
                        onClick={() => track(plugin.id)}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
