"use client";

import { useState } from "react";
import type { AirportView } from "@/lib/types";
import { BellIcon, CheckIcon } from "./icons";

type Status = "idle" | "loading" | "success" | "error";

export function AlertForm({
  airports,
  defaultOrigin = "",
  defaultDestination = "",
  fixedRoute = false,
  title = "Receba as próximas ofertas",
  description = "Escolha a rota e o preço máximo. Avisamos por e-mail quando aparecer algo dentro do seu limite.",
}: {
  airports: AirportView[];
  defaultOrigin?: string;
  defaultDestination?: string;
  fixedRoute?: boolean;
  title?: string;
  description?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const originAirport = airports.find(
    (airport) => airport.iata === defaultOrigin,
  );
  const destinationAirport = airports.find(
    (airport) => airport.iata === defaultDestination,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setStatus("loading");
    setMessage("");
    setDevUrl(null);

    const form = new FormData(formElement);
    const payload = {
      email: String(form.get("email") ?? ""),
      origin: String(form.get("origin") ?? "") || null,
      destination: String(form.get("destination") ?? "") || null,
      maxPrice: form.get("maxPrice") ? Number(form.get("maxPrice")) : null,
      departFrom: String(form.get("departFrom") ?? "") || null,
      departTo: String(form.get("departTo") ?? "") || null,
      consent: form.get("consent") === "on",
      website: String(form.get("website") ?? ""),
    };

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        devConfirmUrl?: string;
      };
      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ?? "Não foi possível criar o alerta agora.",
        );
      }
      setStatus("success");
      setMessage(
        data.message ??
          "Quase lá! Enviamos um link de confirmação para o seu e-mail. Confirme para ativar o alerta.",
      );
      setDevUrl(data.devConfirmUrl ?? null);
      formElement.reset();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Erro inesperado. Tente novamente.",
      );
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-good/20 bg-good-soft p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-good text-paper">
            <CheckIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-ink">
              Alerta quase ativo
            </h3>
            <p className="mt-1 text-sm leading-6 text-ink-soft">{message}</p>
            {devUrl ? (
              <a
                href={devUrl}
                className="mt-3 inline-flex text-sm font-bold text-teal underline underline-offset-4"
              >
                Confirmar agora (modo desenvolvimento)
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-4 block text-xs font-semibold text-muted underline underline-offset-4"
            >
              Criar outro alerta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-paper p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-coral-soft text-coral">
          <BellIcon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="label">Seu e-mail</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="voce@exemplo.com"
            className="field"
          />
        </label>

        {fixedRoute ? (
          <>
            <input type="hidden" name="origin" value={defaultOrigin} />
            <input type="hidden" name="destination" value={defaultDestination} />
            <div className="rounded-xl border border-line bg-cream/70 px-4 py-3 text-sm">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted">
                Rota do alerta
              </span>
              <p className="mt-0.5 font-semibold">
                {originAirport?.city ?? defaultOrigin} →{" "}
                {destinationAirport?.city ?? defaultDestination}
              </p>
            </div>
          </>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">Saindo de</span>
              <select
                name="origin"
                defaultValue={defaultOrigin}
                className="field"
              >
                <option value="">Qualquer origem</option>
                {airports.map((airport) => (
                  <option key={airport.iata} value={airport.iata}>
                    {airport.city} ({airport.iata})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Indo para</span>
              <select
                name="destination"
                defaultValue={defaultDestination}
                className="field"
              >
                <option value="">Qualquer destino</option>
                {airports.map((airport) => (
                  <option key={airport.iata} value={airport.iata}>
                    {airport.city} ({airport.iata})
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="label">Preço máximo (R$)</span>
            <input
              type="number"
              name="maxPrice"
              min={100}
              step={50}
              placeholder="2500"
              className="field"
            />
          </label>
          <label className="block">
            <span className="label">Ida a partir de</span>
            <input
              type="date"
              name="departFrom"
              min={today}
              className="field"
            />
          </label>
          <label className="block">
            <span className="label">Ida até</span>
            <input type="date" name="departTo" min={today} className="field" />
          </label>
        </div>

        <label className="flex items-start gap-2.5 text-xs leading-5 text-muted">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-0.5 h-4 w-4 rounded border-line accent-teal"
          />
          <span>
            Concordo em receber alertas por e-mail e li a{" "}
            <a
              href="/privacidade"
              className="font-semibold text-teal underline underline-offset-2"
            >
              política de privacidade
            </a>
            . Posso cancelar quando quiser.
          </span>
        </label>

        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        {status === "error" ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status === "loading"}
          className="btn btn-primary w-full"
        >
          {status === "loading" ? "Criando alerta..." : "Quero receber alertas"}
        </button>
        <p className="text-center text-[11px] text-muted">
          Sem spam. Só ofertas que passam no filtro de preço.
        </p>
      </div>
    </form>
  );
}
