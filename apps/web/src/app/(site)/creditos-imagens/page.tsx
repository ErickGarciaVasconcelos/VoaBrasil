import type { Metadata } from "next";
import Link from "next/link";
import { destinationImages } from "@/lib/destination-images.generated";

export const metadata: Metadata = {
  title: "Créditos das imagens",
  description:
    "Autores, licenças e fontes das fotografias dos destinos exibidas no Voa Leve.",
  alternates: { canonical: "/creditos-imagens" },
};

export default function ImageCreditsPage() {
  const entries = Object.entries(destinationImages).sort((a, b) =>
    a[1].city.localeCompare(b[1].city, "pt-BR"),
  );

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Transparência</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">
          Créditos das imagens
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted">
          As fotos dos destinos vêm da Wikimedia Commons. Cada autoria e licença
          são mantidas nestes créditos, inclusive quando a imagem aparece em
          uma lista ou cartão sem legenda visível.
        </p>

        <ul className="mt-8 divide-y divide-line rounded-3xl border border-line bg-paper px-5">
          {entries.map(([iata, image]) => (
            <li
              key={iata}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3.5 text-sm"
            >
              <span className="font-semibold text-ink">
                {image.city} <span className="text-muted">({iata})</span>
              </span>
              <span className="text-xs text-muted">
                Foto:{" "}
                <a
                  href={image.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-teal hover:underline"
                >
                  {image.credit}
                </a>{" "}
                ·{" "}
                <a
                  href={image.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-teal hover:underline"
                >
                  {image.license}
                </a>
              </span>
            </li>
          ))}
        </ul>

        <Link
          href="/como-funciona"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-bold text-teal"
        >
          Entender a metodologia
        </Link>
      </div>
    </div>
  );
}
