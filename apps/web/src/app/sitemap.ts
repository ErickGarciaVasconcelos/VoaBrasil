import type { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/queries";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const staticPages: MetadataRoute.Sitemap = [
  { url: `${site.url}/`, changeFrequency: "hourly", priority: 1 },
  { url: `${site.url}/ofertas`, changeFrequency: "hourly", priority: 0.9 },
  { url: `${site.url}/passagens`, changeFrequency: "daily", priority: 0.8 },
  { url: `${site.url}/alertas`, changeFrequency: "monthly", priority: 0.8 },
  {
    url: `${site.url}/como-funciona`,
    changeFrequency: "monthly",
    priority: 0.6,
  },
  { url: `${site.url}/termos`, changeFrequency: "yearly", priority: 0.2 },
  {
    url: `${site.url}/privacidade`,
    changeFrequency: "yearly",
    priority: 0.2,
  },
  {
    url: `${site.url}/divulgacao-afiliado`,
    changeFrequency: "yearly",
    priority: 0.2,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const { offers, routes } = await getSitemapData();

    const offerPages: MetadataRoute.Sitemap = offers.map((offer) => ({
      url: `${site.url}/ofertas/${offer.slug}`,
      lastModified: offer.publishedAt ?? undefined,
      changeFrequency: "daily",
      priority: 0.7,
    }));

    const routePages: MetadataRoute.Sitemap = routes.flatMap((route) => [
      {
        url: `${site.url}/passagens/${route.origin.iata}`,
        lastModified: route.lastCollectedAt ?? undefined,
        changeFrequency: "daily" as const,
        priority: 0.6,
      },
      {
        url: `${site.url}/passagens/${route.origin.iata}/${route.destination.iata}`,
        lastModified: route.lastCollectedAt ?? undefined,
        changeFrequency: "daily" as const,
        priority: 0.7,
      },
    ]);

    const seen = new Set<string>();
    const uniqueRoutes = routePages.filter((page) => {
      if (seen.has(page.url)) return false;
      seen.add(page.url);
      return true;
    });

    return [...staticPages, ...uniqueRoutes, ...offerPages];
  } catch (error) {
    console.error("[sitemap] erro ao carregar dados:", error);
    return staticPages;
  }
}
