"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { saveSiteSettingsAction } from "@/server/actions/settings";
import { Panel } from "./AdminChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SiteSettings } from "@/server/settings";

/**
 * Three fields, one save. Before this screen existed, changing the Instagram
 * handle or the phone number meant a developer finding it hardcoded in
 * `SiteFooter.tsx`, `SiteHeader.tsx`'s mobile menu, and the about page, and
 * editing all three together — or missing one, and having the site disagree
 * with itself about its own phone number.
 */
export function SettingsEditor({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [instagram, setInstagram] = useState(settings.instagram);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [ripNumber, setRipNumber] = useState(settings.ripNumber);

  function save(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveSiteSettingsAction({ instagram, phone, email, ripNumber });
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Panel title="Contact channels">
      <form onSubmit={save} className="max-w-lg space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="instagram">Instagram handle</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">@</span>
            <Input
              id="instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
              placeholder="trendyplaza_architecture"
              className="figures"
              dir="ltr"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Without the @. Used for the profile link and everywhere the handle is shown.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone / WhatsApp number</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+213555000000"
            className="figures"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground">
            International format, digits only after the +. Used for the call link, the
            WhatsApp link, and the displayed number.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Contact email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@trendyplaza.dz"
            dir="ltr"
          />
        </div>

        <div className="space-y-1.5 border-t border-border pt-5">
          <Label htmlFor="ripNumber">Baridimob RIP number</Label>
          <Input
            id="ripNumber"
            value={ripNumber}
            onChange={(e) => setRipNumber(e.target.value)}
            placeholder="00799999000123456789"
            className="figures"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground">
            Shown to a student on the on-hold screen once they choose to pay by transfer. Used to
            be a build-time value only a developer could change; now it is live on save, same as
            the fields above.
          </p>
        </div>

        <Button type="submit" disabled={isPending} className="gap-1.5">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Save
        </Button>
      </form>
    </Panel>
  );
}
