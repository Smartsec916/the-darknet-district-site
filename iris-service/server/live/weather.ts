// Weather for any place on Earth. Forecast: MET Norway Locationforecast (free, no key, CC BY 4.0, needs a
// User-Agent and caching). Official alerts: the US National Weather Service, for US places only; for everywhere else
// Iris is told alerts are NOT available, so she never claims "no warnings". Everything the provider returns is
// range-checked before it can reach the model.
import { LiveError, clean, getJson } from "./http";
import { Budget, TtlCache } from "./cache";
import type { GeoPlace } from "./geocode";

export interface Alert { event: string; severity: string; headline: string; endsAt: number | null }
export interface Day { date: string; highC: number | null; lowC: number | null; condition: string; precipMm: number | null; partial: boolean }
export interface Weather {
  place: GeoPlace;
  updatedAt: number;
  now: { tempC: number; feelsC: number; humidityPct: number | null; windKmh: number | null; windFrom: string | null; cloudPct: number | null; condition: string };
  days: Day[];
  alerts: { available: boolean; items: Alert[] };
  source: string;
}

const forecasts = new TtlCache<any>(300);
const warnings = new TtlCache<Alert[]>(300);
export const forecastBudget = new Budget(60, 60_000);
export const alertBudget = new Budget(40, 60_000);
const US = new Set(["us", "pr", "gu", "vi", "as", "mp"]);

// ---- plain-language conditions from MET's symbol codes ("lightrainshowersandthunder_day")
export function describeSymbol(code: unknown): string {
  const raw = String(code ?? "").replace(/_(day|night|polartwilight)$/, "");
  if (!raw) return "unknown conditions";
  const thunder = raw.includes("thunder"), core = raw.replace("andthunder", "");
  const strength = core.startsWith("light") ? "light " : core.startsWith("heavy") ? "heavy " : "";
  const kind = core.replace(/^(light|heavy)/, "");
  const base: Record<string, string> = {
    clearsky: "clear skies", fair: "mostly clear", partlycloudy: "partly cloudy", cloudy: "cloudy", fog: "fog",
    rain: "rain", rainshowers: "rain showers", sleet: "sleet", sleetshowers: "sleet showers", snow: "snow", snowshowers: "snow showers",
  };
  const text = base[kind];
  if (!text) return thunder ? "thunderstorms" : "unsettled weather";
  return thunder ? `${strength}${text} with thunderstorms` : `${strength}${text}`;
}
const SEVERITY: Array<[RegExp, number]> = [[/thunder/, 9], [/heavy/, 8], [/snow|sleet/, 7], [/rain/, 6], [/fog/, 5], [/^cloudy/, 4], [/partlycloudy/, 3], [/fair/, 2], [/clearsky/, 1]];
const severity = (code: string) => SEVERITY.find(([re]) => re.test(code))?.[1] ?? 0;

// ---- feels-like: wind chill (Environment Canada) when cold and windy, heat index (NWS Rothfusz) when hot and humid
export function feelsLikeC(tempC: number, humidityPct: number | null, windKmh: number | null): number {
  if (tempC <= 10 && windKmh !== null && windKmh > 4.8) {
    const v = Math.pow(windKmh, 0.16);
    return 13.12 + 0.6215 * tempC - 11.37 * v + 0.3965 * tempC * v;
  }
  if (tempC >= 26.7 && humidityPct !== null && humidityPct >= 40) {
    const t = tempC * 9 / 5 + 32, r = humidityPct;
    const hi = -42.379 + 2.04901523 * t + 10.14333127 * r - 0.22475541 * t * r - 0.00683783 * t * t - 0.05481717 * r * r
      + 0.00122874 * t * t * r + 0.00085282 * t * r * r - 0.00000199 * t * t * r * r;
    return (hi - 32) * 5 / 9;
  }
  return tempC;
}

const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
const compass = (deg: number) => COMPASS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
const round1 = (n: number) => Math.round(n * 10) / 10;

function localParts(ms: number, zone: string): { date: string; hour: number } {
  const p: Record<string, string> = {};
  for (const x of new Intl.DateTimeFormat("en-CA", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit" }).formatToParts(new Date(ms))) p[x.type] = x.value;
  return { date: `${p.year}-${p.month}-${p.day}`, hour: +p.hour % 24 };
}

const num = (v: unknown, lo: number, hi: number): number | null => (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : null);

// ---- MET JSON -> Weather (pure; tested against a real captured response)
export function interpretForecast(raw: any, place: GeoPlace): Weather {
  const series: any[] = raw?.properties?.timeseries;
  if (!Array.isArray(series) || series.length < 2) throw new LiveError("invalid", "no forecast series");
  const first = series[0]?.data?.instant?.details;
  const tempC = num(first?.air_temperature, -90, 60);
  if (tempC === null) throw new LiveError("invalid", "no current temperature");
  const humidity = num(first?.relative_humidity, 0, 100);
  const windMs = num(first?.wind_speed, 0, 120);
  const windKmh = windMs === null ? null : Math.round(windMs * 3.6);
  const fromDeg = num(first?.wind_from_direction, 0, 360);
  const updatedAt = Date.parse(raw?.properties?.meta?.updated_at ?? "") || Date.parse(series[0].time) || 0;
  const symbol0 = series[0]?.data?.next_1_hours?.summary?.symbol_code ?? series[0]?.data?.next_6_hours?.summary?.symbol_code;

  const days = new Map<string, { hi: number[]; lo: number[]; precip: number; precipSeen: boolean; codes: string[]; firstHour: number }>();
  for (let i = 0; i < series.length; i++) {
    const e = series[i], at = Date.parse(e?.time);
    if (!Number.isFinite(at)) continue;
    const t = num(e?.data?.instant?.details?.air_temperature, -90, 60);
    const { date, hour } = localParts(at, place.zone);
    const d = days.get(date) ?? { hi: [], lo: [], precip: 0, precipSeen: false, codes: [], firstHour: hour };
    if (t !== null) { d.hi.push(t); d.lo.push(t); }
    const step = i + 1 < series.length ? (Date.parse(series[i + 1].time) - at) / 3600_000 : 1;
    const h1 = e?.data?.next_1_hours, h6 = e?.data?.next_6_hours;
    if (step <= 1.5 && h1) {
      const p = num(h1?.details?.precipitation_amount, 0, 500);
      if (p !== null) { d.precip += p; d.precipSeen = true; }
      if (hour >= 6 && hour <= 21 && h1?.summary?.symbol_code) d.codes.push(String(h1.summary.symbol_code));
    } else if (h6) {
      const p = num(h6?.details?.precipitation_amount, 0, 1000), mx = num(h6?.details?.air_temperature_max, -90, 60), mn = num(h6?.details?.air_temperature_min, -90, 60);
      if (p !== null) { d.precip += p; d.precipSeen = true; }
      if (mx !== null) d.hi.push(mx);
      if (mn !== null) d.lo.push(mn);
      if (hour >= 6 && hour <= 18 && h6?.summary?.symbol_code) d.codes.push(String(h6.summary.symbol_code));
    }
    days.set(date, d);
  }
  const out: Day[] = [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(0, 5).map(([date, d], index) => ({
    date,
    highC: d.hi.length ? round1(Math.max(...d.hi)) : null,
    lowC: d.lo.length ? round1(Math.min(...d.lo)) : null,
    condition: describeSymbol(d.codes.sort((a, b) => severity(b) - severity(a))[0] ?? (index === 0 ? symbol0 : undefined)),
    precipMm: d.precipSeen ? round1(d.precip) : null,
    partial: index === 0 && d.firstHour > 3,
  }));
  return {
    place, updatedAt,
    now: {
      tempC: round1(tempC), feelsC: round1(feelsLikeC(tempC, humidity, windKmh)), humidityPct: humidity === null ? null : Math.round(humidity),
      windKmh, windFrom: fromDeg === null ? null : compass(fromDeg), cloudPct: (() => { const c = num(first?.cloud_area_fraction, 0, 100); return c === null ? null : Math.round(c); })(),
      condition: describeSymbol(symbol0),
    },
    days: out, alerts: { available: false, items: [] }, source: "MET Norway (api.met.no), CC BY 4.0",
  };
}

const RANK: Record<string, number> = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1 };
export function interpretAlerts(raw: any): Alert[] {
  const features: any[] = Array.isArray(raw?.features) ? raw.features : [];
  return features.map(f => f?.properties).filter(Boolean).map(p => ({
    event: clean(p.event, 80), severity: clean(p.severity, 20) || "Unknown", headline: clean(p.headline, 200),
    endsAt: Date.parse(p.ends ?? p.expires ?? "") || null,
  })).filter(a => a.event).sort((a, b) => (RANK[b.severity] ?? 0) - (RANK[a.severity] ?? 0)).slice(0, 3);
}

export interface WeatherResult { weather: Weather; cache: "hit" | "miss" | "stale"; alertsCache: "hit" | "miss" | "stale" | "n/a" }

export async function getWeather(place: GeoPlace): Promise<WeatherResult> {
  const lat = place.lat.toFixed(2), lon = place.lon.toFixed(2);
  const { value, source } = await forecasts.get(`${lat},${lon}`, 10 * 60_000, 2 * 3600_000, async () => {
    if (!forecastBudget.take()) throw new LiveError("http", "weather lookups are rate limited");
    return getJson(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`, { timeoutMs: 6000, maxBytes: 1_500_000 });
  });
  const weather = interpretForecast(value, place);
  let alertsCache: WeatherResult["alertsCache"] = "n/a";
  if (place.countryCode && US.has(place.countryCode)) {
    try {
      const { value: items, source: s } = await warnings.get(`${lat},${lon}`, 5 * 60_000, 30 * 60_000, async () => {
        if (!alertBudget.take()) throw new LiveError("http", "alert lookups are rate limited");
        return interpretAlerts(await getJson(`https://api.weather.gov/alerts/active?point=${place.lat.toFixed(4)},${place.lon.toFixed(4)}`, { accept: "application/geo+json", timeoutMs: 5000, maxBytes: 600_000 }));
      });
      weather.alerts = { available: true, items }; alertsCache = s;
    } catch { /* alerts stay "not available": she will say she could not check them */ }
  }
  return { weather, cache: source, alertsCache };
}

export function resetWeatherForTests(): void { forecasts.clear(); warnings.clear(); forecastBudget.reset(); alertBudget.reset(); }
