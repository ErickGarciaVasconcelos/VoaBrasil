import { cn } from "@/lib/cn";
import { levelEmoji, levelLabel } from "@/lib/format";

const tones: Record<string, string> = {
  good: "bg-good-soft text-good",
  great: "bg-coral-soft text-coral",
  error: "bg-red-100 text-red-700",
};

export function LevelBadge({
  level,
  className,
}: {
  level: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
        tones[level] ?? tones.good,
        className,
      )}
    >
      <span aria-hidden>{levelEmoji(level)}</span>
      {levelLabel(level)}
    </span>
  );
}
