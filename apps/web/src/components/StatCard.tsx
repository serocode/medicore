import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  count: number;
  label: string;
  colorClassName: string;
}

export function StatCard({ icon: Icon, count, label, colorClassName }: StatCardProps) {
  return (
    <div className={`flex items-center gap-4 rounded-lg p-5 text-white ${colorClassName}`}>
      <Icon className="h-8 w-8" />
      <div>
        <p className="text-2xl font-semibold">{count}</p>
        <p className="text-sm text-white/80">{label}</p>
      </div>
    </div>
  );
}
