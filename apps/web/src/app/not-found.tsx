import Link from "next/link";
import { PlaneIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-paper">
          <PlaneIcon className="h-5 w-5 -rotate-12" />
        </span>
        <span className="font-display text-2xl font-bold">
          voa leve<span className="text-coral">.</span>
        </span>
      </Link>

      <p className="mt-10 font-display text-7xl font-extrabold text-line">404</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">
        Essa oferta decolou
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted">
        A página não existe ou a oferta já expirou. Tarifas boas duram pouco —
        veja o que está no ar agora.
      </p>

      <div className="mt-7 flex flex-col gap-2 sm:flex-row">
        <Link href="/ofertas" className="btn btn-primary">
          Ver ofertas ativas
        </Link>
        <Link href="/" className="btn btn-outline">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
