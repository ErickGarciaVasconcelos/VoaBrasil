import type { AirportView } from "@/lib/types";
import { SearchIcon } from "./icons";

export function SearchBox({
  airports,
  defaultOrigin = "GRU",
  className,
}: {
  airports: AirportView[];
  defaultOrigin?: string;
  className?: string;
}) {
  return (
    <form
      action="/passagens"
      method="get"
      className={`rounded-2xl border border-line bg-paper p-3 shadow-[0_18px_40px_-30px_rgba(11,27,43,0.5)] ${className ?? ""}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="label">Saindo de</span>
          <select name="origin" defaultValue={defaultOrigin} className="field">
            {airports.map((airport) => (
              <option key={airport.iata} value={airport.iata}>
                {airport.city} ({airport.iata})
              </option>
            ))}
          </select>
        </label>

        <label className="flex-1">
          <span className="label">Indo para</span>
          <select name="destination" defaultValue="" className="field">
            <option value="">Qualquer destino</option>
            {airports.map((airport) => (
              <option key={airport.iata} value={airport.iata}>
                {airport.city} ({airport.iata})
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className="btn btn-primary sm:mb-0.5">
          <SearchIcon className="h-4 w-4" />
          Buscar ofertas
        </button>
      </div>
    </form>
  );
}
