// Recent earthquakes from the US Geological Survey (official, free, no key). Two shapes: the worldwide summary feeds,
// or a search around a place. Magnitudes and times are reported exactly as the USGS gives them.
import { LiveError, clean, getJson } from "./http";
import { Budget, TtlCache } from "./cache";
import type { GeoPlace } from "./geocode";

export interface Quake { mag: number; place: string; at: number; depthKm: number | null; url: string | null; tsunami: boolean; alert: string | null; felt: number | null }
export interface QuakeReport {
  quakes: Quake[]; scope: string; minMag: number; days: number; generatedAt: number; totalMatching: number;
  source: string;
}
export type QuakeRequest = { near?: GeoPlace; minMag?: number; days?: number; limit?: number; strongest?: boolean };

const cache = new TtlCache<any>(60);
export const budget = new Budget(40, 60_000);

export function interpretQuakes(raw: any): { quakes: Quake[]; generatedAt: number } {
  const features: any[] = Array.isArray(raw?.features) ? raw.features : [];
  const quakes: Quake[] = [];
  for (const f of features) {
    const p = f?.properties ?? {};
    const mag = typeof p.mag === "number" && Number.isFinite(p.mag) && p.mag > -2 && p.mag < 10.5 ? p.mag : null;
    const at = typeof p.time === "number" && Number.isFinite(p.time) ? p.time : null;
    const place = clean(p.place, 120);
    if (mag === null || at === null || !place) continue;
    const depth = Array.isArray(f?.geometry?.coordinates) && typeof f.geometry.coordinates[2] === "number" ? Math.round(f.geometry.coordinates[2]) : null;
    const url = typeof p.url === "string" && /^https:\/\/earthquake\.usgs\.gov\//.test(p.url) ? p.url : null;
    quakes.push({ mag: Math.round(mag * 10) / 10, place, at, depthKm: depth, url, tsunami: p.tsunami === 1, alert: typeof p.alert === "string" ? clean(p.alert, 12) : null, felt: typeof p.felt === "number" ? p.felt : null });
  }
  return { quakes, generatedAt: typeof raw?.metadata?.generated === "number" ? raw.metadata.generated : 0 };
}

export async function getQuakes(request: QuakeRequest = {}, now: number = Date.now()): Promise<{ report: QuakeReport; cache: "hit" | "miss" | "stale" }> {
  const limit = Math.min(Math.max(request.limit ?? 5, 1), 8);
  const days = Math.min(Math.max(Math.round(request.days ?? 1), 1), 30);
  let url: string, key: string, scope: string, minMag: number;
  if (request.near) {
    minMag = Math.min(Math.max(request.minMag ?? 2.5, 0), 9);
    const lat = request.near.lat.toFixed(2), lon = request.near.lon.toFixed(2);
    const start = new Date(now - days * 86400_000).toISOString().slice(0, 19);
    // The start time is rounded to the hour so identical questions share a cache entry
    const startHour = start.slice(0, 13) + ":00:00";
    url = "https://earthquake.usgs.gov/fdsnws/event/1/query?" + new URLSearchParams({
      format: "geojson", latitude: lat, longitude: lon, maxradiuskm: "500", minmagnitude: String(minMag), starttime: startHour,
      orderby: request.strongest ? "magnitude" : "time", limit: "20",
    });
    key = `near:${lat},${lon}:${minMag}:${days}:${request.strongest ? "m" : "t"}`;
    scope = `within 500 km of ${request.near.label}`;
  } else {
    const wanted = request.minMag ?? (days > 1 ? 4.5 : 2.5);
    const tier = wanted >= 4.5 ? "4.5" : wanted >= 2.5 ? "2.5" : "1.0";
    minMag = Number(tier);
    const span = days <= 1 ? "day" : days <= 7 ? "week" : "month";
    url = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${tier}_${span}.geojson`;
    key = `world:${tier}:${span}`;
    scope = "worldwide";
  }
  const { value, source } = await cache.get(key, 5 * 60_000, 60 * 60_000, async () => {
    if (!budget.take()) throw new LiveError("http", "earthquake lookups are rate limited");
    return getJson(url, { timeoutMs: 6000, maxBytes: 2_000_000 });
  });
  const parsed = interpretQuakes(value);
  const cutoff = now - days * 86400_000;
  const matching = parsed.quakes.filter(q => q.at >= cutoff && q.at <= now + 3600_000 && q.mag >= (request.minMag ?? minMag));
  matching.sort(request.strongest ? (a, b) => b.mag - a.mag || b.at - a.at : (a, b) => b.at - a.at);
  return { report: { quakes: matching.slice(0, limit), scope, minMag: request.minMag ?? minMag, days, generatedAt: parsed.generatedAt, totalMatching: matching.length, source: "US Geological Survey (earthquake.usgs.gov)" }, cache: source };
}

export function resetQuakesForTests(): void { cache.clear(); budget.reset(); }
