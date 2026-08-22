import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

/** Two letters, or one, or a dash. Never an empty circle. */
export function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => [...part][0]?.toUpperCase() ?? "")
    .join("");
  return letters || "—";
}

/**
 * The student's face, wherever it appears.
 *
 * Initials are the fallback rather than a stock silhouette: an anonymous
 * outline says "we do not know who you are" on a page whose whole job is to
 * say the opposite. `alt` is empty because the name is always rendered beside
 * it or read from the control that wraps it, and a screen reader announcing
 * "photo of Yasmine, Yasmine" is noise.
 */
export function StudentAvatar({
  name,
  image,
  className,
}: {
  name: string;
  image: string | null;
  className?: string;
}) {
  const src = avatarUrl(image);

  return (
    <Avatar className={cn("h-9 w-9 border border-rule", className)}>
      {src && <AvatarImage src={src} alt="" className="object-cover" />}
      <AvatarFallback className="bg-primary/10 text-[0.75em] font-bold text-primary-press">
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );
}
