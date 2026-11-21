import { levelEmoji, levelLabel } from "@/lib/format";
import { cn } from "@/lib/cn";

const statusStyles: Record<string, string> = {
  draft: "bg-sun/15 text-[#7a5100] ring-sun/30",
  approved: "bg-teal-soft text-teal ring-teal/20",
  published: "bg-good-soft text-good ring-good/20",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  expired: "bg-cream text-muted ring-line",
};

const statusLabels: Record<string, string> = {
  draft: "rascunho",
  approved: "aprovada",
  published: "publicada",
  rejected: "rejeitada",
  expired: "expirada",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1",
        statusStyles[status] ?? "bg-cream text-muted ring-line",
      )}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

export function LevelPill({ level }: { level: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
      <span aria-hidden>{levelEmoji(level)}</span>
      {levelLabel(level)}
    </span>
  );
}
