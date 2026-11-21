"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, offerEvents, offers, routes } from "@ppa/db";
import {
  collectPrices,
  detectDeals,
  dispatchNotifications,
  expireOffers,
  publishOffer,
  refreshBucketStats,
  seedDemo,
} from "@ppa/jobs";
import {
  checkPassword,
  createSession,
  destroySession,
  requireAdmin,
} from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

function offerIdFrom(formData: FormData): string {
  return String(formData.get("offerId") ?? "").trim();
}

export async function loginAction(formData: FormData): Promise<void> {
  const requestHeaders = await headers();
  const limit = rateLimit(
    `admin-login:${clientIp(requestHeaders)}`,
    8,
    10 * 60_000,
  );
  if (!limit.ok) redirect("/admin/login?erro=limite");

  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) redirect("/admin/login?erro=credenciais");

  await createSession();
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

export async function publishAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const offerId = offerIdFrom(formData);
  if (!offerId) redirect("/admin/ofertas?erro=id");

  let failure: string | null = null;
  try {
    await publishOffer(offerId, "admin");
  } catch (error) {
    console.error("[admin] erro ao publicar:", error);
    failure = error instanceof Error ? error.message : "Erro ao publicar";
  }

  if (failure) {
    redirect(`/admin/ofertas/${offerId}?erro=publicar`);
  }
  revalidatePath("/", "layout");
  redirect(`/admin/ofertas/${offerId}?ok=publicada`);
}

export async function rejectAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const offerId = offerIdFrom(formData);
  if (!offerId) redirect("/admin/ofertas?erro=id");

  const db = await getDb();
  const now = new Date();
  await db
    .update(offers)
    .set({ status: "rejected", updatedAt: now })
    .where(eq(offers.id, offerId));
  await db.insert(offerEvents).values({
    offerId,
    type: "rejected",
    actor: "admin",
  });

  revalidatePath("/", "layout");
  redirect(`/admin/ofertas/${offerId}?ok=rejeitada`);
}

export async function expireAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const offerId = offerIdFrom(formData);
  if (!offerId) redirect("/admin/ofertas?erro=id");

  const db = await getDb();
  const now = new Date();
  await db
    .update(offers)
    .set({ status: "expired", updatedAt: now })
    .where(eq(offers.id, offerId));
  await db.insert(offerEvents).values({
    offerId,
    type: "expired_manually",
    actor: "admin",
  });

  revalidatePath("/", "layout");
  redirect(`/admin/ofertas/${offerId}?ok=expirada`);
}

export async function reopenAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const offerId = offerIdFrom(formData);
  if (!offerId) redirect("/admin/ofertas?erro=id");

  const db = await getDb();
  const now = new Date();
  await db
    .update(offers)
    .set({ status: "draft", publishedAt: null, expiresAt: null, updatedAt: now })
    .where(eq(offers.id, offerId));
  await db.insert(offerEvents).values({
    offerId,
    type: "reopened",
    actor: "admin",
  });

  revalidatePath("/", "layout");
  redirect(`/admin/ofertas/${offerId}?ok=reaberta`);
}

export async function toggleRouteAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const routeId = String(formData.get("routeId") ?? "").trim();
  const enabled = String(formData.get("enabled") ?? "") === "true";
  if (!routeId) redirect("/admin/rotas?erro=id");

  const db = await getDb();
  await db
    .update(routes)
    .set({ monitorEnabled: enabled })
    .where(eq(routes.id, routeId));

  revalidatePath("/admin/rotas");
  redirect(`/admin/rotas?ok=${enabled ? "ativada" : "pausada"}`);
}

export async function updateRouteAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const routeId = String(formData.get("routeId") ?? "").trim();
  if (!routeId) redirect("/admin/rotas?erro=id");

  const ceilingRaw = String(formData.get("ceiling") ?? "").trim();
  const ceilingNumber = ceilingRaw
    ? Number(ceilingRaw.replace(/\./g, "").replace(",", "."))
    : null;
  const priorityNumber = Number(formData.get("priority") ?? 5);
  const maxStopsNumber = Number(formData.get("maxStops") ?? 2);

  if (
    ceilingNumber != null &&
    (!Number.isFinite(ceilingNumber) || ceilingNumber <= 0)
  ) {
    redirect(`/admin/rotas?erro=ceiling`);
  }

  const db = await getDb();
  await db
    .update(routes)
    .set({
      ceilingCents:
        ceilingNumber != null ? Math.round(ceilingNumber * 100) : null,
      priority: Number.isFinite(priorityNumber)
        ? Math.min(Math.max(Math.trunc(priorityNumber), 1), 10)
        : 5,
      maxStops: Number.isFinite(maxStopsNumber)
        ? Math.min(Math.max(Math.trunc(maxStopsNumber), 0), 4)
        : 2,
    })
    .where(eq(routes.id, routeId));

  revalidatePath("/admin/rotas");
  redirect("/admin/rotas?ok=rota-atualizada");
}

export async function runDemoAction(): Promise<void> {
  await requireAdmin();
  let summary = "";
  try {
    const result = await seedDemo({ reset: true });
    summary = `ofertas=${result.published}&snapshots=${result.snapshots}`;
  } catch (error) {
    console.error("[admin] erro na demonstração:", error);
    redirect("/admin?erro=demo");
  }

  revalidatePath("/", "layout");
  redirect(`/admin?ok=demo&${summary}`);
}

export async function runPipelineAction(): Promise<void> {
  await requireAdmin();
  let summary = "";
  try {
    const collect = await collectPrices({ limit: 10 });
    const stats = await refreshBucketStats();
    const detect = await detectDeals({ autoPublish: true, maxOffers: 40 });
    const notify = await dispatchNotifications({ limit: 100 });
    summary = [
      `snapshots=${collect.snapshots}`,
      `buckets=${stats.buckets}`,
      `criadas=${detect.created}`,
      `publicadas=${detect.published}`,
      `enviadas=${notify.sent}`,
    ].join("&");
  } catch (error) {
    console.error("[admin] erro no pipeline:", error);
    redirect("/admin?erro=pipeline");
  }

  revalidatePath("/", "layout");
  redirect(`/admin?ok=pipeline&${summary}`);
}

export async function dispatchAction(): Promise<void> {
  await requireAdmin();
  let processed = 0;
  try {
    const result = await dispatchNotifications({ limit: 100 });
    processed = result.processed;
  } catch (error) {
    console.error("[admin] erro ao enviar notificações:", error);
    redirect("/admin?erro=notify");
  }

  revalidatePath("/admin");
  redirect(`/admin?ok=notify&processadas=${processed}`);
}

export async function expireAllAction(): Promise<void> {
  await requireAdmin();
  let expired = 0;
  try {
    const result = await expireOffers();
    expired = result.expired;
  } catch (error) {
    console.error("[admin] erro ao expirar ofertas:", error);
    redirect("/admin?erro=expire");
  }

  revalidatePath("/", "layout");
  redirect(`/admin?ok=expire&expiradas=${expired}`);
}
