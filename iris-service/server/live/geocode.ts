// Place name -> coordinates and IANA time zone, for weather, earthquakes and time questions about places the time
// service does not know. Nominatim (OpenStreetMap) answers the name; the time zone comes from an offline lookup
// (@photostructure/tz-lookup), so no second request is made. Results are cached for a month: place names do not move,
// and the provider's usage policy asks for a User-Agent, at most one request a second, and caching.
import tzlookup from "@photostructure/tz-lookup";
import { LiveError, clean, getJson } from "./http";
import { Budget, Spacer, TtlCache, timer } from "./cache";

export interface GeoPlace {
  name: string; admin?: string; country?: string; countryCode?: string;
  lat: number; lon: number; zone: string; label: string; importance: number; type: string;
}
export type GeoResult =
  | { kind: "one"; place: GeoPlace }
  | { kind: "ambiguous"; query: string; options: GeoPlace[] }
  | { kind: "none"; reason: "unknown" | "unavailable" };

const DAY = 24 * 3600_000;
const found = new TtlCache<GeoResult>(500);
let spacer = new Spacer(1100);
/** Tests only: the provider's one-request-a-second spacing makes a suite of lookups slow */
export function setGeocodeGapForTests(ms: number): void { spacer = new Spacer(ms); }
export const budget = new Budget(20, 60_000);

const PLACE_TYPES = new Set(["city", "town", "village", "municipality", "hamlet", "suburb", "city_district", "borough", "district",
  "state", "province", "region", "state_district", "county", "country", "island", "archipelago", "territory"]);

// What goes to the provider: letters, digits, spaces and a little punctuation, never more than 80 characters
export function cleanQuery(raw: string): string {
  return clean(raw, 120).replace(/[^\p{L}\p{N}\s,.'’-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

function toPlace(r: any): GeoPlace | null {
  const lat = Number(r?.lat), lon = Number(r?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  if (!PLACE_TYPES.has(String(r?.addresstype ?? ""))) return null;
  const a = r.address ?? {};
  const name = clean(r.name || a.city || a.town || a.village || a.state || a.country, 80);
  if (!name) return null;
  const admin = clean(a.state || a.region || a.province || a.county, 80) || undefined;
  const country = clean(a.country, 80) || undefined;
  let zone: string;
  try { zone = tzlookup(lat, lon); } catch { return null; }
  const label = [name, admin && admin !== name ? admin : undefined, country && country !== name ? country : undefined].filter(Boolean).join(", ");
  return { name, admin, country, countryCode: typeof a.country_code === "string" ? a.country_code.toLowerCase() : undefined, lat, lon, zone, label, importance: Number(r.importance) || 0, type: String(r.addresstype) };
}

export function interpret(rows: unknown, query: string): GeoResult {
  const places: GeoPlace[] = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    const place = toPlace(row);
    if (place && !places.some(p => p.label === place.label)) places.push(place);
  }
  if (!places.length) return { kind: "none", reason: "unknown" };
  const top = places[0];
  // "Portland" is several places; "Portland, Oregon" and a place with no real rival are one
  if (!query.includes(",")) {
    // A rival must be about as important as the best match, the same kind of place (a city is not confused with a village of the
    // same name), and somewhere else: Sacramento is California's, not the Brazilian town or the Kentucky one
    const rivals = places.slice(1).filter(p => p.importance >= Math.max(0.3, top.importance * 0.75) && (p.type === top.type || p.importance >= top.importance * 0.95) && (p.countryCode !== top.countryCode || p.admin !== top.admin));
    if (rivals.length) return { kind: "ambiguous", query, options: [top, ...rivals].slice(0, 4) };
  }
  return { kind: "one", place: top };
}

class NotFound extends Error {}
const unknownNames = new TtlCache<true>(200); // a name the provider did not know: remembered for ten minutes only, so a typo is not cached for a month

export async function geocode(raw: string): Promise<{ result: GeoResult; cache: "hit" | "miss" | "stale" }> {
  const query = cleanQuery(raw);
  const none = (reason: "unknown" | "unavailable"): { result: GeoResult; cache: "miss" } => ({ result: { kind: "none", reason }, cache: "miss" });
  if (query.length < 2) return none("unknown");
  const key = query.toLowerCase();
  const missed = unknownNames.peek(key);
  if (missed && timer.now() - missed.at < 10 * 60_000) return none("unknown");
  try {
    const { value, source } = await found.get(key, 30 * DAY, 335 * DAY, () => spacer.run(async () => {
      if (!budget.take()) throw new LiveError("http", "place lookups are rate limited");
      const rows = await getJson("https://nominatim.openstreetmap.org/search?" + new URLSearchParams({
        q: query, format: "jsonv2", limit: "6", addressdetails: "1", "accept-language": "en",
      }), { timeoutMs: 6000, maxBytes: 300_000 });
      const result = interpret(rows, query);
      if (result.kind === "none") throw new NotFound();
      return result;
    }));
    return { result: value, cache: source };
  } catch (error) {
    if (error instanceof NotFound) { unknownNames.set(key, true); return none("unknown"); }
    return none("unavailable");
  }
}

export function resetGeocodeForTests(): void { found.clear(); unknownNames.clear(); budget.reset(); }
