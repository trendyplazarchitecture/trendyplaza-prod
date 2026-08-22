"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/server/session";
import { redeemCode } from "@/server/codes";
import { submitAccessRequest } from "@/server/access-requests";
import { MAX_AVATAR_BYTES, MAX_RECEIPT_BYTES, storeAvatar } from "@/server/storage";
import { clearAvatar, setAvatar, setDisplayName } from "@/server/profile";
import { limitByIp, rateLimit } from "@/server/rate-limit";

/**
 * What a signed-in student can do for themselves: type the code from the card
 * in their pack, or send the receipt for a Baridimob transfer.
 *
 * Both are rate limited twice, per account and per address. A card code is
 * short enough to be worth guessing at scale, and the account limit is the one
 * that bites a script that has signed up once and is working through the
 * alphabet.
 */

const redeemInput = z.object({
  code: z.string().trim().min(4).max(64),
});

export type RedeemActionResult =
  | { ok: true; message: string }
  | { ok: false; reason: RedeemFailure };

export type RedeemFailure =
  | "not_found"
  | "already_redeemed"
  | "voided"
  | "expired"
  | "already_entitled"
  | "rate_limited"
  | "invalid";

export async function redeemCodeAction(
  input: z.infer<typeof redeemInput>,
): Promise<RedeemActionResult> {
  const user = await requireUser();

  const parsed = redeemInput.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  // Ten a minute for the account, thirty for the address. A student reading
  // a card off paper needs two or three; anything above that is a script.
  const perUser = rateLimit(`redeem:user:${user.id}`, { limit: 10, windowSeconds: 60 });
  if (!perUser.ok) return { ok: false, reason: "rate_limited" };

  const perIp = await limitByIp("redeem", { limit: 30, windowSeconds: 60 });
  if (!perIp.ok) return { ok: false, reason: "rate_limited" };

  const result = await redeemCode(parsed.data.code, user.id);
  if (!result.ok) return { ok: false, reason: result.reason };

  revalidatePath("/", "layout");
  return { ok: true, message: "redeemed" };
}

export type AccessRequestResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "too_large"
        | "unsupported_type"
        | "duplicate_pending"
        | "no_file"
        | "invalid"
        | "rate_limited";
    };

/**
 * The receipt path. Takes `FormData` rather than a plain object because the
 * receipt is a file, and a file crossing a server action boundary any other
 * way means base64 in a JSON payload.
 *
 * Nothing here trusts the file's name or its declared type: `storeUpload`
 * sniffs magic bytes, caps the size, re-encodes images and writes to a random
 * filename outside the web root.
 */
export async function submitAccessRequestAction(
  formData: FormData,
): Promise<AccessRequestResult> {
  const user = await requireUser();

  const perUser = rateLimit(`receipt:user:${user.id}`, { limit: 5, windowSeconds: 600 });
  if (!perUser.ok) return { ok: false, reason: "rate_limited" };

  const packageId = String(formData.get("packageId") ?? "");
  if (!z.string().uuid().safeParse(packageId).success) {
    return { ok: false, reason: "invalid" };
  }

  const rawAmount = String(formData.get("amountClaimedDzd") ?? "").trim();
  const amountDinars = rawAmount ? Number(rawAmount) : null;
  if (amountDinars !== null && !Number.isFinite(amountDinars)) {
    return { ok: false, reason: "invalid" };
  }

  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, reason: "no_file" };
  }
  // Checked before the bytes are pulled into memory as well as inside
  // `storeUpload`, so an oversized upload is refused without being buffered.
  if (file.size > MAX_RECEIPT_BYTES) return { ok: false, reason: "too_large" };

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await submitAccessRequest(
    user.id,
    {
      packageId,
      // Money is centimes everywhere. The student types dinars.
      amountClaimedDzd: amountDinars === null ? null : Math.round(amountDinars * 100),
    },
    buffer,
  );

  if (!result.ok) return { ok: false, reason: result.error };

  revalidatePath("/", "layout");
  return { ok: true };
}

export type ProfileResult =
  | { ok: true }
  | { ok: false; reason: "too_large" | "unsupported_type" | "no_file" | "invalid" | "rate_limited" };

/**
 * A profile picture, set by the student and by nobody else.
 *
 * `FormData` for the same reason the receipt is: a file crossing a server
 * action boundary any other way is base64 inside a JSON payload. The bytes are
 * sniffed, squared and re-encoded by `storeAvatar`; the name the browser sent
 * is never used to build a path.
 */
export async function updateAvatarAction(formData: FormData): Promise<ProfileResult> {
  const user = await requireUser();

  // Ten a day. Changing a picture is not something anyone does twice.
  const perUser = rateLimit(`avatar:user:${user.id}`, { limit: 10, windowSeconds: 3600 });
  if (!perUser.ok) return { ok: false, reason: "rate_limited" };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { ok: false, reason: "no_file" };
  // Refused before the bytes are pulled into memory, as well as inside
  // `storeAvatar`.
  if (file.size > MAX_AVATAR_BYTES) return { ok: false, reason: "too_large" };

  const stored = await storeAvatar(Buffer.from(await file.arrayBuffer()));
  if (!stored.ok) return { ok: false, reason: stored.error };

  await setAvatar(user.id, stored.relativePath);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeAvatarAction(): Promise<ProfileResult> {
  const user = await requireUser();
  await clearAvatar(user.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

const displayName = z.object({ name: z.string().trim().min(2).max(80) });

/**
 * The name that greets them and sits under their picture. Not the email, which
 * is the identity Better Auth authenticates and is not editable from here.
 */
export async function updateDisplayNameAction(
  input: z.infer<typeof displayName>,
): Promise<ProfileResult> {
  const user = await requireUser();

  const parsed = displayName.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  const perUser = rateLimit(`name:user:${user.id}`, { limit: 10, windowSeconds: 3600 });
  if (!perUser.ok) return { ok: false, reason: "rate_limited" };

  await setDisplayName(user.id, parsed.data.name);
  revalidatePath("/", "layout");
  return { ok: true };
}
