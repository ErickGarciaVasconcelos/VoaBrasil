import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/admin/actions";
import { PlaneIcon } from "@/components/icons";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar no painel",
  robots: { index: false, follow: false },
};

const errors: Record<string, string> = {
  credenciais: "Senha incorreta. Tente novamente.",
  limite: "Muitas tentativas. Aguarde alguns minutos.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await getAdminSession()) redirect("/admin");
  const params = await searchParams;
  const error =
    typeof params.erro === "string" ? errors[params.erro] : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-paper">
            <PlaneIcon className="h-5 w-5 -rotate-12" />
          </span>
          <span className="font-display text-2xl font-bold">
            voa leve<span className="text-coral">.</span>
          </span>
        </div>

        <form
          action={loginAction}
          className="rounded-3xl border border-line bg-paper p-7 shadow-sm sm:p-8"
        >
          <p className="eyebrow">Área restrita</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold">
            Painel administrativo
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Entre para revisar ofertas, publicar tarifas e acompanhar a coleta.
          </p>

          <label className="mt-6 block">
            <span className="label">Senha do administrador</span>
            <input
              type="password"
              name="password"
              required
              autoFocus
              autoComplete="current-password"
              className="field"
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn-primary mt-5 w-full">
            Entrar no painel
          </button>

          {process.env.NODE_ENV !== "production" ? (
            <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-center text-xs text-muted">
              Desenvolvimento: a senha padrão é{" "}
              <code className="font-bold text-ink">admin123</code>.
            </p>
          ) : null}
        </form>

        <p className="mt-5 text-center text-xs text-muted">
          <Link href="/" className="font-semibold text-teal hover:underline">
            ← Voltar ao site
          </Link>
        </p>
      </div>
    </div>
  );
}
