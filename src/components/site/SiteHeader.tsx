"use client";

import { ArrowUpRight, LayoutGrid, Menu, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Link, usePathname } from "../../../i18n/navigation";
import { isRtlLocale } from "../../../i18n/routing";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { contactLinks } from "@/lib/contact";
import type { SiteSettings } from "@/server/settings";

const NAV = [
  { href: "/", key: "nav.home" },
  { href: "/catalogue", key: "nav.catalogue" },
  { href: "/courses", key: "nav.courses" },
  { href: "/about", key: "nav.about" },
  { href: "/contact", key: "nav.contact" },
] as const;

export function SiteHeader({
  signedIn,
  isStaff,
  name,
  cartCount,
  settings,
}: {
  signedIn: boolean;
  isStaff: boolean;
  name: string | null;
  cartCount: number;
  settings: SiteSettings;
}) {
  const contact = contactLinks(settings);
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // `createPortal`'s target, `document.body`, does not exist during server
  // rendering, and calling it conditionally on `open` — `{open &&
  // createPortal(...)}` — turned out not to reliably mount at all: the state
  // flipped (`aria-expanded` read "true") but nothing appeared in the DOM.
  // AnimatePresence tracking a child that is itself freshly created or
  // destroyed by a portal call on every open/close is not the pattern
  // framer-motion's own docs use. The portal below is created once, right
  // after mount, and stays in the DOM the whole time; AnimatePresence
  // animates a plain conditional child *inside* that stable portal instead,
  // which is the documented shape and the one that actually works.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A route change with the menu still open leaves the page unscrollable.
  useEffect(() => setOpen(false), [pathname]);

  // The panel covers the page, so the page behind it must not scroll.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const accountHref = isStaff ? "/admin" : signedIn ? "/account" : "/login";
  const accountLabel = isStaff
    ? t("nav.dashboard")
    : signedIn
      ? t("nav.myAccount")
      : t("nav.signIn");

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b bg-background/85 backdrop-blur-md transition-[border-color,box-shadow] duration-300",
          scrolled ? "border-rule shadow-[0_1px_0_rgba(17,17,19,0.04)]" : "border-transparent",
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-12">
          <Link
            href="/"
            aria-label={t("nav.home")}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="shrink-0"
          >
            <Logo markClassName="h-7" />
          </Link>

          <nav className="mx-auto hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  // `ScrollToTop` fires on a pathname change, so clicking the
                  // nav title for the page already open — scrolled halfway
                  // down it — did nothing, since the pathname never changes.
                  // This covers that case and costs nothing on a real
                  // navigation, where the page was going to land at the top
                  // anyway.
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className={cn(
                    "relative rounded-md px-3 py-2 text-sm transition-colors duration-150",
                    active
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(item.key)}
                  {/* A hairline under the current page, drawn rather than
                      filled, so the nav stays a row of words. */}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 -bottom-px h-px bg-primary"
                      transition={{ duration: 0.3, ease: EASE_OUT }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ms-auto flex items-center gap-1.5 md:ms-0">
            <LanguageSwitcher />

            <Link
              href="/checkout"
              aria-label={cartCount > 0 ? t("cart.withCount", { count: cartCount }) : t("nav.cart")}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-paper hover:text-foreground"
            >
              <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
              {/* The count is announced through the link's label, so the badge
                  itself is decoration and stays out of the accessible name. */}
              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="figures absolute -end-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <Link
              href={accountHref}
              className={cn(
                "hidden h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors sm:inline-flex",
                isStaff
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "border border-border text-foreground hover:border-foreground/30 hover:bg-paper",
              )}
            >
              {isStaff ? (
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              ) : (
                <User className="h-4 w-4" aria-hidden="true" />
              )}
              {accountLabel}
            </Link>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t("nav.openMenu")}
              aria-expanded={open}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-paper md:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/*
        Full screen, one column, nothing else on it. A 360px phone has room
        for six words and a thumb, and a drawer that keeps the page visible
        behind it just makes both harder to read.

        Portalled to the body, and mounted once `mounted` is true rather than
        re-created on every open. `position: fixed` is positioned against the
        nearest ancestor that creates a containing block — a `transform`,
        `filter` or `will-change` anywhere between this element and the root,
        not only on its immediate parent — and this app puts `transform` on
        page content constantly for scroll-reveal motion. A menu rendered in
        place is one new `Reveal` away from being trapped inside a scrolled
        section instead of covering the viewport.
      */}
      {mounted &&
        createPortal(
          // `pointer-events` is set here, on a wrapper that renders on every
          // pass with the live `open` value, not inside the `{open && (...)}`
          // branch below. Once `open` goes false that branch stops rendering
          // at all, so AnimatePresence keeps animating out whatever it had
          // last captured — frozen with the props from when `open` was still
          // true. A `pointer-events-none` written inside that branch would
          // never see `open === false` and would never apply: the panel
          // would stay clickable, invisible, over the whole screen, for as
          // long as the exit takes (or forever, on a tab whose animation
          // frames are throttled). This wrapper is what actually turns
          // clicks off the moment `open` flips, independent of the exit
          // animation's own timing.
          <div style={{ pointerEvents: open ? "auto" : "none" }}>
            <AnimatePresence>
              {open && (
                <motion.div
                  key="mobile-menu"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: EASE_OUT }}
                  className="fixed inset-0 z-[60] flex flex-col bg-background md:hidden"
                  role="dialog"
                  aria-modal="true"
                  aria-label={t("nav.openMenu")}
                >
                  <div
                    aria-hidden="true"
                    className="sheet-grid sheet-grid-fade pointer-events-none absolute inset-x-0 top-0 h-64"
                  />

                  <div className="flex h-16 shrink-0 items-center justify-between px-4">
                    <Logo markClassName="h-7" />
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label={t("nav.closeMenu")}
                      autoFocus
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-paper"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>

                  <nav
                    className="relative flex flex-1 flex-col justify-center px-6 pb-24"
                    aria-label="Main"
                  >
                    <ul className="space-y-1">
                      {NAV.map((item, i) => (
                        <motion.li
                          key={item.href}
                          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 + i * 0.05, duration: 0.35, ease: EASE_OUT }}
                        >
                          <Link
                            href={item.href}
                            className="flex items-baseline justify-between border-b border-border py-4 text-3xl font-extrabold tracking-tight transition-colors hover:text-primary-press"
                          >
                            {t(item.key)}
                            <ArrowUpRight
                              className="h-5 w-5 shrink-0 text-muted-foreground rtl:-scale-x-100"
                              aria-hidden="true"
                            />
                          </Link>
                        </motion.li>
                      ))}
                    </ul>

                    <motion.div
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.35, ease: EASE_OUT }}
                      className="mt-10 space-y-3"
                    >
                      <Link
                        href={accountHref}
                        className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-press"
                      >
                        {isStaff ? (
                          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <User className="h-4 w-4" aria-hidden="true" />
                        )}
                        {accountLabel}
                      </Link>

                      {!signedIn && (
                        <Link
                          href="/signup"
                          className="flex h-12 items-center justify-center rounded-lg border border-border px-6 text-sm font-semibold transition-colors hover:border-foreground/30 hover:bg-paper"
                        >
                          {t("auth.createAccount")}
                        </Link>
                      )}

                      {signedIn && name && (
                        <p className="pt-1 text-center text-xs text-muted-foreground">
                          {t("nav.signedInAs", { name })}
                        </p>
                      )}
                    </motion.div>
                  </nav>

                  <div
                    className="absolute inset-x-0 bottom-0 flex items-center justify-between px-6 pb-8 text-xs text-muted-foreground"
                    dir={isRtlLocale(locale) ? "rtl" : "ltr"}
                  >
                    <a href={contact.instagram.href} className="hover:text-foreground">
                      <bdi dir="ltr">{contact.instagram.display}</bdi>
                    </a>
                    <a href={contact.phone.href} className="hover:text-foreground">
                      <bdi dir="ltr">{contact.phone.display}</bdi>
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </>
  );
}
