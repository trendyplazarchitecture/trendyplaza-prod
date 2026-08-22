"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, Store, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "../../../i18n/navigation";
import { StudentAvatar } from "./StudentAvatar";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * The picture, the name, and everything that is about the person rather than
 * about the material.
 *
 * `compact` is the top bar on a phone, where there is room for the face and
 * nothing else. The full form carries the name and the one line under it that
 * says what this account is, because "Yasmine" alone does not tell a student
 * whose account they are looking at on a shared laptop.
 */
export function PortalUserMenu({
  name,
  email,
  image,
  isStaff,
  compact = false,
}: {
  name: string;
  email: string;
  image: string | null;
  isStaff: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("portal.menu");
  const router = useRouter();
  const [pending, start] = useTransition();

  function signOut() {
    start(async () => {
      await authClient.signOut();
      // `replace`, not `push`: the dashboard behind us is gone now.
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-start transition-colors hover:bg-paper",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          compact ? "w-auto" : "w-full",
        )}
      >
        <StudentAvatar name={name} image={image} className={compact ? "h-8 w-8" : undefined} />
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {t("role")}
              </span>
            </span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </>
        )}
        <span className="sr-only">{t("open")}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/account#profile" className="flex items-center gap-2 text-sm">
            <UserRound className="h-4 w-4" aria-hidden="true" />
            {t("profile")}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/catalogue" className="flex items-center gap-2 text-sm">
            <Store className="h-4 w-4" aria-hidden="true" />
            {t("shop")}
          </Link>
        </DropdownMenuItem>

        {/* Staff sign in through the same door as everyone else, so the way
            across to the admin belongs here rather than in a second header. */}
        {isStaff && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center gap-2 text-sm">
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                {t("admin")}
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} className="flex items-center gap-2 text-sm">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {pending ? t("signingOut") : t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
