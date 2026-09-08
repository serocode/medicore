// Drawn from the emerald/ochre/neutral system rather than Tailwind's stock
// hues, so a wall of avatars still reads as one product.
const PALETTE = [
  "bg-primary text-on-primary",
  "bg-primary-muted text-on-primary",
  "bg-accent text-on-primary",
  "bg-inverse text-on-inverse",
  "bg-primary-soft-dim text-on-primary-soft",
  "bg-accent-soft-dim text-on-accent-soft",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

function colorFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % PALETTE.length;
  return PALETTE[Math.abs(hash) % PALETTE.length] ?? "bg-primary text-on-primary";
}

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
}

/**
 * Decorative by design. Every call site in the product renders the person's
 * name in text right beside the avatar, so an `alt` of the name — or letting
 * a reader spell out the initials — announces it twice. `name` is an input to
 * the picture, not a label for it.
 */
export function Avatar({ name, imageUrl, size = 32 }: AvatarProps) {
  const style = { width: size, height: size };

  if (imageUrl) {
    return (
      <img src={imageUrl} alt="" style={style} className="shrink-0 rounded-full object-cover" />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={style}
      className={`flex shrink-0 items-center justify-center rounded-full font-display text-xs font-semibold ${colorFor(name)}`}
    >
      {initials(name)}
    </span>
  );
}
