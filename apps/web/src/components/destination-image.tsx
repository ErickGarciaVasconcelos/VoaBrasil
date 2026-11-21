import Image from "next/image";
import { cn } from "@/lib/cn";
import { destinationImages } from "@/lib/destination-images.generated";

type DestinationImageProps = {
  iata: string;
  city: string;
  className?: string;
  /** Miniatura circular usada em listas; sem legenda. */
  compact?: boolean;
  showCredit?: boolean;
  priority?: boolean;
};

export function DestinationImage({
  iata,
  city,
  className,
  compact = false,
  showCredit = true,
  priority = false,
}: DestinationImageProps) {
  const data = destinationImages[iata];

  if (compact) {
    return (
      <span
        className={cn(
          "relative block shrink-0 overflow-hidden rounded-full bg-cream ring-1 ring-line",
          className,
        )}
      >
        {data ? (
          <Image
            src={data.src}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <span className="grid h-full w-full place-items-center font-display text-[10px] font-bold text-ink-soft">
            {iata}
          </span>
        )}
      </span>
    );
  }

  return (
    <figure className={cn("w-full", className)}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-ink">
        {data ? (
          <Image
            src={data.src}
            alt={`Vista de ${city}`}
            fill
            sizes="(max-width: 1024px) 100vw, 35vw"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-ink to-teal font-display text-4xl font-extrabold text-paper">
            {iata}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/5 to-transparent" />
        <p className="absolute bottom-4 left-5 right-5 font-display text-2xl font-bold text-paper drop-shadow">
          {city}
        </p>
      </div>
      {data && showCredit ? (
        <figcaption className="mt-2 text-[10px] leading-4 text-muted">
          Foto:{" "}
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-line underline-offset-2 hover:text-teal"
          >
            {data.credit}
          </a>{" "}
          ·{" "}
          <a
            href={data.licenseUrl}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-line underline-offset-2 hover:text-teal"
          >
            {data.license}
          </a>
        </figcaption>
      ) : null}
    </figure>
  );
}
