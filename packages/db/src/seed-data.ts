export type AirportSeed = {
  iata: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  timezone: string;
  lat: number;
  lon: number;
};

export type RouteSeed = {
  origin: string;
  destination: string;
  priority: number;
  maxStops: number;
  maxDurationMinutes: number;
  ceilingCents: number;
  /** Preço-base do gerador de demonstração, em centavos. */
  basePriceCents: number;
  baseTripDays: number;
  carrier: string;
  durationMinutes: number;
  stops: number;
};

const br = (
  iata: string,
  name: string,
  city: string,
  state: string,
  lat: number,
  lon: number,
): AirportSeed => ({
  iata,
  name,
  city,
  state,
  country: "BR",
  timezone: "America/Sao_Paulo",
  lat,
  lon,
});

const intl = (
  iata: string,
  name: string,
  city: string,
  country: string,
  timezone: string,
  lat: number,
  lon: number,
): AirportSeed => ({
  iata,
  name,
  city,
  country,
  timezone,
  lat,
  lon,
});

export const AIRPORTS: AirportSeed[] = [
  br("GRU", "Aeroporto Internacional de São Paulo/Guarulhos", "São Paulo", "SP", -23.4356, -46.4731),
  br("CGH", "Aeroporto de Congonhas", "São Paulo", "SP", -23.6261, -46.6564),
  br("VCP", "Aeroporto Internacional de Viracopos", "Campinas", "SP", -23.0074, -47.1345),
  br("GIG", "Aeroporto Internacional do Galeão", "Rio de Janeiro", "RJ", -22.8099, -43.2506),
  br("SDU", "Aeroporto Santos Dumont", "Rio de Janeiro", "RJ", -22.9105, -43.1631),
  br("BSB", "Aeroporto Internacional de Brasília", "Brasília", "DF", -15.8711, -47.9186),
  br("CNF", "Aeroporto Internacional de Confins", "Belo Horizonte", "MG", -19.6244, -43.9719),
  br("REC", "Aeroporto Internacional do Recife", "Recife", "PE", -8.1265, -34.9236),
  br("SSA", "Aeroporto Internacional de Salvador", "Salvador", "BA", -12.9086, -38.3225),
  br("FOR", "Aeroporto Internacional de Fortaleza", "Fortaleza", "CE", -3.7763, -38.5326),
  br("POA", "Aeroporto Internacional Salgado Filho", "Porto Alegre", "RS", -29.9944, -51.1714),
  br("CWB", "Aeroporto Internacional Afonso Pena", "Curitiba", "PR", -25.5285, -49.1758),
  br("BEL", "Aeroporto Internacional de Belém", "Belém", "PA", -1.3793, -48.4763),
  br("MAO", "Aeroporto Internacional Eduardo Gomes", "Manaus", "AM", -3.0386, -60.0497),
  br("FLN", "Aeroporto Internacional Hercílio Luz", "Florianópolis", "SC", -27.6703, -48.5525),
  br("IGU", "Aeroporto Internacional de Foz do Iguaçu", "Foz do Iguaçu", "PR", -25.6003, -54.4850),
  br("NAT", "Aeroporto Internacional de Natal", "Natal", "RN", -5.7681, -35.3661),
  br("MCZ", "Aeroporto Internacional Zumbi dos Palmares", "Maceió", "AL", -9.5108, -35.7917),
  br("VIX", "Aeroporto de Vitória", "Vitória", "ES", -20.2581, -40.2864),
  br("GYN", "Aeroporto de Goiânia", "Goiânia", "GO", -16.6320, -49.2207),
  br("SLZ", "Aeroporto Internacional de São Luís", "São Luís", "MA", -2.5853, -44.2341),
  br("THE", "Aeroporto de Teresina", "Teresina", "PI", -5.0597, -42.8235),
  intl("LIS", "Aeroporto Humberto Delgado", "Lisboa", "PT", "Europe/Lisbon", 38.7742, -9.1342),
  intl("OPO", "Aeroporto Francisco Sá Carneiro", "Porto", "PT", "Europe/Lisbon", 41.2481, -8.6814),
  intl("MAD", "Aeroporto Adolfo Suárez Madrid-Barajas", "Madri", "ES", "Europe/Madrid", 40.4719, -3.5626),
  intl("CDG", "Aeroporto Charles de Gaulle", "Paris", "FR", "Europe/Paris", 49.0097, 2.5479),
  intl("LHR", "Aeroporto de Heathrow", "Londres", "GB", "Europe/London", 51.4700, -0.4543),
  intl("FCO", "Aeroporto Leonardo da Vinci", "Roma", "IT", "Europe/Rome", 41.8003, 12.2389),
  intl("MIA", "Aeroporto Internacional de Miami", "Miami", "US", "America/New_York", 25.7959, -80.2870),
  intl("MCO", "Aeroporto Internacional de Orlando", "Orlando", "US", "America/New_York", 28.4312, -81.3081),
  intl("JFK", "Aeroporto John F. Kennedy", "Nova York", "US", "America/New_York", 40.6413, -73.7781),
  intl("EZE", "Aeroporto Internacional de Ezeiza", "Buenos Aires", "AR", "America/Argentina/Buenos_Aires", -34.8222, -58.5358),
  intl("SCL", "Aeroporto Internacional Arturo Merino Benítez", "Santiago", "CL", "America/Santiago", -33.3930, -70.7858),
  intl("LIM", "Aeroporto Internacional Jorge Chávez", "Lima", "PE", "America/Lima", -12.0219, -77.1143),
  intl("BOG", "Aeroporto Internacional El Dorado", "Bogotá", "CO", "America/Bogota", 4.7016, -74.1469),
  intl("CUN", "Aeroporto Internacional de Cancún", "Cancún", "MX", "America/Cancun", 21.0365, -86.8771),
  intl("MVD", "Aeroporto Internacional de Carrasco", "Montevidéu", "UY", "America/Montevideo", -34.8384, -56.0308),
  intl("PUJ", "Aeroporto Internacional de Punta Cana", "Punta Cana", "DO", "America/Santo_Domingo", 18.5674, -68.3634),
];

export const ROUTE_SEEDS: RouteSeed[] = [
  // Internacional saindo de São Paulo
  { origin: "GRU", destination: "LIS", priority: 1, maxStops: 1, maxDurationMinutes: 1200, ceilingCents: 420000, basePriceCents: 380000, baseTripDays: 10, carrier: "TP", durationMinutes: 780, stops: 0 },
  { origin: "GRU", destination: "MIA", priority: 1, maxStops: 1, maxDurationMinutes: 900, ceilingCents: 360000, basePriceCents: 320000, baseTripDays: 9, carrier: "AA", durationMinutes: 540, stops: 0 },
  { origin: "GRU", destination: "JFK", priority: 2, maxStops: 1, maxDurationMinutes: 1000, ceilingCents: 400000, basePriceCents: 350000, baseTripDays: 10, carrier: "LA", durationMinutes: 600, stops: 0 },
  { origin: "GRU", destination: "MAD", priority: 2, maxStops: 1, maxDurationMinutes: 1100, ceilingCents: 450000, basePriceCents: 390000, baseTripDays: 12, carrier: "IB", durationMinutes: 660, stops: 0 },
  { origin: "GRU", destination: "CDG", priority: 2, maxStops: 1, maxDurationMinutes: 1200, ceilingCents: 480000, basePriceCents: 420000, baseTripDays: 12, carrier: "AF", durationMinutes: 720, stops: 0 },
  { origin: "GRU", destination: "FCO", priority: 3, maxStops: 1, maxDurationMinutes: 1200, ceilingCents: 470000, basePriceCents: 410000, baseTripDays: 11, carrier: "AZ", durationMinutes: 720, stops: 1 },
  { origin: "GRU", destination: "EZE", priority: 1, maxStops: 1, maxDurationMinutes: 420, ceilingCents: 220000, basePriceCents: 180000, baseTripDays: 6, carrier: "AR", durationMinutes: 180, stops: 0 },
  { origin: "GRU", destination: "SCL", priority: 2, maxStops: 1, maxDurationMinutes: 480, ceilingCents: 230000, basePriceCents: 190000, baseTripDays: 7, carrier: "LA", durationMinutes: 240, stops: 0 },
  { origin: "GRU", destination: "LIM", priority: 3, maxStops: 1, maxDurationMinutes: 540, ceilingCents: 250000, basePriceCents: 210000, baseTripDays: 7, carrier: "LA", durationMinutes: 330, stops: 1 },
  { origin: "GRU", destination: "BOG", priority: 3, maxStops: 1, maxDurationMinutes: 600, ceilingCents: 270000, basePriceCents: 230000, baseTripDays: 7, carrier: "AV", durationMinutes: 390, stops: 1 },

  // Internacional saindo do Rio, Brasília e Confins
  { origin: "GIG", destination: "LIS", priority: 1, maxStops: 1, maxDurationMinutes: 1100, ceilingCents: 440000, basePriceCents: 390000, baseTripDays: 10, carrier: "TP", durationMinutes: 620, stops: 0 },
  { origin: "GIG", destination: "MIA", priority: 2, maxStops: 1, maxDurationMinutes: 900, ceilingCents: 380000, basePriceCents: 330000, baseTripDays: 9, carrier: "AA", durationMinutes: 540, stops: 0 },
  { origin: "GIG", destination: "EZE", priority: 1, maxStops: 1, maxDurationMinutes: 420, ceilingCents: 210000, basePriceCents: 170000, baseTripDays: 5, carrier: "G3", durationMinutes: 180, stops: 0 },
  { origin: "GIG", destination: "MCO", priority: 3, maxStops: 1, maxDurationMinutes: 1000, ceilingCents: 400000, basePriceCents: 350000, baseTripDays: 10, carrier: "AD", durationMinutes: 570, stops: 1 },
  { origin: "BSB", destination: "LIS", priority: 2, maxStops: 1, maxDurationMinutes: 1100, ceilingCents: 450000, basePriceCents: 400000, baseTripDays: 11, carrier: "TP", durationMinutes: 660, stops: 1 },
  { origin: "BSB", destination: "MIA", priority: 3, maxStops: 1, maxDurationMinutes: 900, ceilingCents: 390000, basePriceCents: 340000, baseTripDays: 9, carrier: "AA", durationMinutes: 480, stops: 0 },
  { origin: "BSB", destination: "MCO", priority: 3, maxStops: 1, maxDurationMinutes: 1000, ceilingCents: 410000, basePriceCents: 360000, baseTripDays: 10, carrier: "AD", durationMinutes: 510, stops: 1 },
  { origin: "CNF", destination: "LIS", priority: 2, maxStops: 1, maxDurationMinutes: 1100, ceilingCents: 445000, basePriceCents: 395000, baseTripDays: 10, carrier: "TP", durationMinutes: 690, stops: 1 },
  { origin: "CNF", destination: "MCO", priority: 3, maxStops: 1, maxDurationMinutes: 1000, ceilingCents: 400000, basePriceCents: 350000, baseTripDays: 10, carrier: "AD", durationMinutes: 570, stops: 1 },

  // Internacional saindo do Nordeste e Norte
  { origin: "REC", destination: "LIS", priority: 1, maxStops: 1, maxDurationMinutes: 1000, ceilingCents: 420000, basePriceCents: 370000, baseTripDays: 10, carrier: "TP", durationMinutes: 600, stops: 0 },
  { origin: "REC", destination: "MIA", priority: 2, maxStops: 1, maxDurationMinutes: 900, ceilingCents: 390000, basePriceCents: 340000, baseTripDays: 9, carrier: "AA", durationMinutes: 540, stops: 0 },
  { origin: "FOR", destination: "LIS", priority: 1, maxStops: 1, maxDurationMinutes: 1000, ceilingCents: 410000, basePriceCents: 360000, baseTripDays: 10, carrier: "TP", durationMinutes: 570, stops: 0 },
  { origin: "FOR", destination: "MCO", priority: 2, maxStops: 1, maxDurationMinutes: 900, ceilingCents: 380000, basePriceCents: 330000, baseTripDays: 9, carrier: "AD", durationMinutes: 510, stops: 1 },
  { origin: "BEL", destination: "LIS", priority: 2, maxStops: 1, maxDurationMinutes: 1000, ceilingCents: 425000, basePriceCents: 375000, baseTripDays: 10, carrier: "TP", durationMinutes: 540, stops: 1 },
  { origin: "MAO", destination: "MIA", priority: 3, maxStops: 1, maxDurationMinutes: 900, ceilingCents: 410000, basePriceCents: 360000, baseTripDays: 9, carrier: "AA", durationMinutes: 480, stops: 1 },

  // Internacional saindo do Sul
  { origin: "POA", destination: "LIS", priority: 2, maxStops: 1, maxDurationMinutes: 1200, ceilingCents: 435000, basePriceCents: 385000, baseTripDays: 11, carrier: "TP", durationMinutes: 720, stops: 1 },
  { origin: "CWB", destination: "LIS", priority: 3, maxStops: 1, maxDurationMinutes: 1200, ceilingCents: 440000, basePriceCents: 390000, baseTripDays: 10, carrier: "TP", durationMinutes: 750, stops: 1 },

  // Doméstico
  { origin: "GRU", destination: "REC", priority: 1, maxStops: 1, maxDurationMinutes: 420, ceilingCents: 120000, basePriceCents: 95000, baseTripDays: 5, carrier: "LA", durationMinutes: 180, stops: 0 },
  { origin: "GRU", destination: "SSA", priority: 1, maxStops: 1, maxDurationMinutes: 420, ceilingCents: 115000, basePriceCents: 90000, baseTripDays: 5, carrier: "G3", durationMinutes: 150, stops: 0 },
  { origin: "GRU", destination: "FOR", priority: 1, maxStops: 1, maxDurationMinutes: 480, ceilingCents: 125000, basePriceCents: 98000, baseTripDays: 5, carrier: "LA", durationMinutes: 210, stops: 0 },
  { origin: "GRU", destination: "POA", priority: 2, maxStops: 1, maxDurationMinutes: 300, ceilingCents: 90000, basePriceCents: 70000, baseTripDays: 4, carrier: "G3", durationMinutes: 100, stops: 0 },
  { origin: "GRU", destination: "CWB", priority: 3, maxStops: 1, maxDurationMinutes: 240, ceilingCents: 75000, basePriceCents: 55000, baseTripDays: 3, carrier: "LA", durationMinutes: 70, stops: 0 },
  { origin: "GRU", destination: "BSB", priority: 2, maxStops: 1, maxDurationMinutes: 240, ceilingCents: 70000, basePriceCents: 50000, baseTripDays: 3, carrier: "LA", durationMinutes: 105, stops: 0 },
  { origin: "GRU", destination: "FLN", priority: 3, maxStops: 1, maxDurationMinutes: 240, ceilingCents: 78000, basePriceCents: 58000, baseTripDays: 4, carrier: "G3", durationMinutes: 80, stops: 0 },
  { origin: "GIG", destination: "REC", priority: 1, maxStops: 1, maxDurationMinutes: 420, ceilingCents: 125000, basePriceCents: 100000, baseTripDays: 5, carrier: "G3", durationMinutes: 165, stops: 0 },
  { origin: "GIG", destination: "SSA", priority: 2, maxStops: 1, maxDurationMinutes: 360, ceilingCents: 118000, basePriceCents: 92000, baseTripDays: 5, carrier: "LA", durationMinutes: 120, stops: 0 },
  { origin: "GIG", destination: "FOR", priority: 2, maxStops: 1, maxDurationMinutes: 480, ceilingCents: 126000, basePriceCents: 99000, baseTripDays: 5, carrier: "LA", durationMinutes: 195, stops: 0 },
  { origin: "GIG", destination: "POA", priority: 3, maxStops: 1, maxDurationMinutes: 300, ceilingCents: 92000, basePriceCents: 72000, baseTripDays: 4, carrier: "G3", durationMinutes: 105, stops: 0 },
  { origin: "BSB", destination: "REC", priority: 2, maxStops: 1, maxDurationMinutes: 420, ceilingCents: 112000, basePriceCents: 88000, baseTripDays: 5, carrier: "LA", durationMinutes: 150, stops: 0 },
  { origin: "BSB", destination: "SSA", priority: 2, maxStops: 1, maxDurationMinutes: 360, ceilingCents: 108000, basePriceCents: 85000, baseTripDays: 5, carrier: "G3", durationMinutes: 120, stops: 0 },
  { origin: "CNF", destination: "REC", priority: 2, maxStops: 1, maxDurationMinutes: 420, ceilingCents: 105000, basePriceCents: 82000, baseTripDays: 5, carrier: "AD", durationMinutes: 150, stops: 0 },
  { origin: "CNF", destination: "FOR", priority: 3, maxStops: 1, maxDurationMinutes: 480, ceilingCents: 110000, basePriceCents: 86000, baseTripDays: 5, carrier: "AD", durationMinutes: 180, stops: 1 },
  { origin: "REC", destination: "FOR", priority: 3, maxStops: 1, maxDurationMinutes: 240, ceilingCents: 62000, basePriceCents: 45000, baseTripDays: 4, carrier: "AD", durationMinutes: 90, stops: 0 },
  { origin: "REC", destination: "SSA", priority: 3, maxStops: 1, maxDurationMinutes: 240, ceilingCents: 58000, basePriceCents: 42000, baseTripDays: 4, carrier: "AD", durationMinutes: 80, stops: 0 },
  { origin: "POA", destination: "GRU", priority: 3, maxStops: 1, maxDurationMinutes: 300, ceilingCents: 88000, basePriceCents: 68000, baseTripDays: 3, carrier: "LA", durationMinutes: 95, stops: 0 },
  { origin: "CWB", destination: "GRU", priority: 3, maxStops: 1, maxDurationMinutes: 240, ceilingCents: 72000, basePriceCents: 52000, baseTripDays: 3, carrier: "G3", durationMinutes: 65, stops: 0 },
];

/** Rotas que recebem uma queda artificial hoje para a demonstração. */
export const DEMO_HIGHLIGHT_ROUTES = [
  "GRU-LIS",
  "GRU-MIA",
  "GIG-EZE",
  "REC-LIS",
  "GRU-REC",
  "CNF-FOR",
];
