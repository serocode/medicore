const PALETTE = [
  "bg-slate-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

function colorFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % PALETTE.length;
  return PALETTE[Math.abs(hash) % PALETTE.length] ?? "bg-slate-500";
}

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
}

export function Avatar({ name, imageUrl, size = 32 }: AvatarProps) {
  const style = { width: size, height: size };

  if (imageUrl) {
    return (
      <img src={imageUrl} alt={name} style={style} className="shrink-0 rounded-full object-cover" />
    );
  }

  return (
    <span
      style={style}
      className={`flex shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ${colorFor(name)}`}
    >
      {initials(name)}
    </span>
  );
}
