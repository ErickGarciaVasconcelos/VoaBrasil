import { cn } from "@/lib/cn";
import { formatBRL, formatDateShort } from "@/lib/format";
import type { HistoryPoint } from "@/lib/types";

export function PriceChart({
  points,
  className,
  id = "price-chart",
}: {
  points: HistoryPoint[];
  className?: string;
  id?: string;
}) {
  if (points.length < 2) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-line bg-cream/60 p-8 text-center text-sm text-muted",
          className,
        )}
      >
        Ainda estamos coletando histórico desta rota. Assim que houver dados
        suficientes, o gráfico aparece aqui.
      </div>
    );
  }

  const width = 720;
  const height = 220;
  const padX = 18;
  const padY = 28;
  const values = points.map((point) => point.priceCents);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);

  const x = (index: number) =>
    padX + (index / (points.length - 1)) * (width - padX * 2);
  const y = (value: number) =>
    padY + (1 - (value - min) / span) * (height - padY * 2);

  const line = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(point.priceCents).toFixed(1)}`,
    )
    .join(" ");
  const area = `${line} L ${x(points.length - 1).toFixed(1)},${height - padY} L ${x(0).toFixed(1)},${height - padY} Z`;
  const last = points[points.length - 1];
  const first = points[0];
  const mid = points[Math.floor(points.length / 2)];

  return (
    <figure className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Histórico de preços: mínimo ${formatBRL(min)}, máximo ${formatBRL(max)}`}
      >
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-teal)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-teal)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={padX}
            x2={width - padX}
            y1={padY + fraction * (height - padY * 2)}
            y2={padY + fraction * (height - padY * 2)}
            stroke="var(--color-line)"
            strokeDasharray="3 6"
          />
        ))}

        <path d={area} fill={`url(#${id}-fill)`} />
        <path
          d={line}
          fill="none"
          stroke="var(--color-teal)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle
          cx={x(points.length - 1)}
          cy={y(last.priceCents)}
          r="5"
          fill="var(--color-coral)"
          stroke="var(--color-paper)"
          strokeWidth="3"
        />

        <text
          x={padX}
          y={padY - 10}
          fill="var(--color-muted)"
          fontSize="11"
          fontWeight="600"
        >
          máx. {formatBRL(max)}
        </text>
        <text
          x={padX}
          y={height - 8}
          fill="var(--color-muted)"
          fontSize="11"
          fontWeight="600"
        >
          mín. {formatBRL(min)}
        </text>
        <text
          x={width - padX}
          y={height - 8}
          textAnchor="end"
          fill="var(--color-muted)"
          fontSize="11"
        >
          {formatDateShort(first.day)} — {formatDateShort(last.day)}
        </text>
        <text
          x={width - padX}
          y={padY - 10}
          textAnchor="end"
          fill="var(--color-coral)"
          fontSize="12"
          fontWeight="700"
        >
          {formatBRL(last.priceCents)}
        </text>
      </svg>
      <figcaption className="mt-2 text-xs text-muted">
        Menor preço observado por dia nos últimos 60 dias · atualizado em{" "}
        {formatDateShort(last.day)}
      </figcaption>
    </figure>
  );
}
