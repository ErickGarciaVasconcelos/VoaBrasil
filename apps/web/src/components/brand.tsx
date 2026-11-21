import Link from "next/link";
import { PlaneIcon } from "./icons";

/** Marca única usada no cabeçalho e no rodapé. */
export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 ${className}`}
      aria-label="Voa Leve — início"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-paper">
        <PlaneIcon className="h-5 w-5 -rotate-12" />
      </span>
      <span className="font-display text-xl font-bold tracking-tight">
        voa leve<span className="text-coral">.</span>
      </span>
    </Link>
  );
}
