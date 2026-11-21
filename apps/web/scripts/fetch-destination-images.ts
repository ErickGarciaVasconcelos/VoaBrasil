import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { AIRPORTS } from "@ppa/db";

/**
 * Baixa fotos dos destinos monitorados da Wikimedia Commons e gera o índice
 * usado pela UI. Créditos e licenças são preservados para exibição no site.
 *
 * Uso: npm run images:fetch
 */

const USER_AGENT =
  "VoaLeveDemo/0.1 (busca de imagens de destinos; contato@voaleve.com.br)";
const OUT_DIR = path.resolve(
  process.cwd(),
  "apps/web/public/destinations",
);
const DATA_FILE = path.resolve(
  process.cwd(),
  "apps/web/src/lib/destination-images.generated.ts",
);

const PAGE_TITLE_OVERRIDES: Record<string, string> = {
  JFK: "Nova York",
  VIX: "Vitória, Espírito Santo",
  SLZ: "São Luís (Maranhão)",
  SCL: "Santiago (Chile)",
};

type Summary = {
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
};

type CommonsResponse = {
  query?: {
    pages?: Record<
      string,
      {
        imageinfo?: Array<{
          descriptionurl?: string;
          extmetadata?: Record<string, { value?: string }>;
        }>;
      }
    >;
  };
};

type Entry = {
  iata: string;
  city: string;
  credit: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  file: string;
};

function cleanHtml(value: string | undefined): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function largeThumbnail(source: string): string {
  const url = new URL(source);
  url.search = "";
  url.pathname = url.pathname.replace(/\/\d+px-/, "/640px-");
  return url.toString();
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} em ${url}`);
  }
  return (await response.json()) as T;
}

async function getImage(
  url: string,
): Promise<{ bytes: Buffer; contentType: string }> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} em ${url}`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Conteúdo não é imagem: ${contentType}`);
  }
  return { bytes: Buffer.from(await response.arrayBuffer()), contentType };
}

async function commonsMetadata(
  originalUrl: string,
): Promise<Pick<Entry, "credit" | "license" | "licenseUrl" | "sourceUrl">> {
  const parts = new URL(originalUrl).pathname.split("/");
  // Em URLs de thumb, o penúltimo segmento é o nome real do arquivo.
  const fileName = decodeURIComponent(
    parts.includes("thumb")
      ? (parts[parts.length - 2] ?? "")
      : (parts[parts.length - 1] ?? ""),
  );
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("titles", `File:${fileName}`);
  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "extmetadata");
  api.searchParams.set("format", "json");

  const data = await getJson<CommonsResponse>(api.toString());
  const page = Object.values(data.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  const meta = info?.extmetadata;

  return {
    credit: cleanHtml(meta?.Artist?.value) || "Wikimedia Commons",
    license: cleanHtml(meta?.LicenseShortName?.value) || "Ver fonte",
    licenseUrl: meta?.LicenseUrl?.value ?? info?.descriptionurl ?? "",
    sourceUrl:
      info?.descriptionurl ??
      `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`,
  };
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  const entries: Entry[] = [];
  const failures: string[] = [];

  for (const airport of AIRPORTS) {
    const title = PAGE_TITLE_OVERRIDES[airport.iata] ?? airport.city;
    const summaryUrl = new URL(
      `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    );

    try {
      const summary = await getJson<Summary>(summaryUrl.toString());
      if (!summary.thumbnail?.source || !summary.originalimage?.source) {
        throw new Error("sem imagem na página");
      }

      const metadata = await commonsMetadata(summary.originalimage.source);
      const candidates = [
        largeThumbnail(summary.thumbnail.source),
        summary.thumbnail.source,
      ];
      let image: { bytes: Buffer; contentType: string } | null = null;
      for (const candidate of candidates) {
        try {
          image = await getImage(candidate);
          break;
        } catch {
          // tenta a miniatura original se o redimensionamento falhar
        }
      }
      if (!image) throw new Error("falha ao baixar a imagem");

      const extension = image.contentType.includes("png") ? "png" : "jpg";
      const file = `${airport.iata.toLowerCase()}.${extension}`;
      await writeFile(path.join(OUT_DIR, file), image.bytes);
      entries.push({ iata: airport.iata, city: airport.city, file, ...metadata });
      console.log(`[ok] ${airport.iata} — ${airport.city}`);
    } catch (error) {
      failures.push(`${airport.iata}: ${(error as Error).message}`);
      console.warn(`[falha] ${airport.iata} — ${(error as Error).message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  const lines = [
    "// Gerado por apps/web/scripts/fetch-destination-images.ts. Não editar à mão.",
    "export type DestinationImage = {",
    "  src: string;",
    "  city: string;",
    "  credit: string;",
    "  license: string;",
    "  licenseUrl: string;",
    "  sourceUrl: string;",
    "};",
    "",
    "export const destinationImages: Record<string, DestinationImage> = {",
    ...entries.map(
      ({ iata, city, credit, license, licenseUrl, sourceUrl, file }) =>
        `  ${JSON.stringify(iata)}: ${JSON.stringify({
          src: `/destinations/${file}`,
          city,
          credit,
          license,
          licenseUrl,
          sourceUrl,
        })},`,
    ),
    "};",
    "",
  ];
  await writeFile(DATA_FILE, lines.join("\n"), "utf8");

  console.log(
    `\n${entries.length} imagens salvas em ${OUT_DIR}\nÍndice: ${DATA_FILE}`,
  );
  if (failures.length > 0) {
    console.warn(`Falhas (${failures.length}):\n${failures.join("\n")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
