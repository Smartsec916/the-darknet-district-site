// What is actually worth knowing, or doubting, about a piece of live data, worked out from the data itself. Iris may voice a
// limitation, a claim or a disagreement only if it is listed here, so she cannot invent a conspiracy, a cover-up or a
// quarrel between sources. The same notes decide when a subject is too serious for jokes.
import type { Weather } from "./weather";
import type { QuakeReport } from "./quakes";
import type { NewsReport } from "./news";

export interface Notes {
  lines: string[];            // shown to her, inside the data block
  skepticalBasis: boolean;    // something real to doubt: an unverified claim, a single outlet, stale or predicted data, disputed figures
  reliable: boolean;          // something real to trust: an official source, several outlets agreeing
  serious: boolean;           // deaths, danger, disaster or a distressed visitor: no jokes
  sentiment: "bad" | "good" | "neutral" | null; // weather only: how the conditions feel, for a fitting remark
  curious: boolean;           // something notable or odd in the data
}

// A visitor who sounds frightened or is asking about their own safety is not given jokes, whatever the data says
const DISTRESS = /\b(scared|afraid|frightened|terrified|worried|worry|anxious|panic\w*|evacuat\w*|emergency|in danger|danger|my (?:family|parents|mom|dad|kids|children|friends?) (?:is|are|live|lives|was|were)|help me|please help|sos)\b|害怕|担心|擔心|危险|危險|紧急|緊急|怖い|心配|危険|緊急|避難|miedo|preocupad[oa]|peligro|emergencia|страшно|боюсь|опасн\w*|помогите|тревож\w*/iu;
export const sounds_distressed = (message: string): boolean => DISTRESS.test(message);

const hours = (ms: number) => Math.max(0, Math.round(ms / 3600_000));
const days = (ms: number) => Math.round(ms / 86400_000 * 10) / 10;

export function weatherNotes(w: Weather, now: number, ctx: { cache: "hit" | "miss" | "stale"; dayOffset: number; multiDay: boolean; message: string }): Notes {
  const lines: string[] = [];
  const modelAge = now - w.updatedAt;
  const modelOld = w.updatedAt > 0 && modelAge > 3 * 3600_000;
  if (modelOld) lines.push(`The forecast model run is ${hours(modelAge)} hours old.`);
  if (w.days[0]?.partial) lines.push("Today's high and low only cover the hours still ahead.");
  if (!w.alerts.available) lines.push("Official alerts could not be checked for this place.");
  if (ctx.cache === "stale") lines.push("The weather provider did not answer, so this is the last answer received (up to two hours old).");
  const farOut = ctx.dayOffset >= 2 || ctx.multiDay;
  if (farOut) lines.push("Forecasts several days ahead are predictions and often change.");
  lines.push("One forecast model is the only source (MET Norway): a prediction for the place, not a measurement taken there.");

  const worst = w.days[0];
  const code = `${w.now.condition} ${worst?.condition ?? ""}`;
  const alerts = w.alerts.items;
  const extremeAlert = alerts.some(a => /^(Severe|Extreme)$/i.test(a.severity) || /tornado|hurricane|typhoon|tsunami|flood|blizzard|fire|evacuat|storm surge|ice storm|extreme|excessive/i.test(a.event));
  const t = w.now.tempC, f = w.now.feelsC, wind = w.now.windKmh ?? 0;
  const serious = extremeAlert || t >= 40 || f >= 45 || t <= -25 || f <= -30 || wind >= 80 || sounds_distressed(ctx.message) || /hurricane|typhoon|tornado|blizzard|tsunami/i.test(ctx.message);
  const bad = /heavy|thunder|snow|sleet|rain|fog/.test(code) || t >= 35 || t <= -10 || wind >= 50 || alerts.length > 0;
  const good = !bad && /clear|mostly clear|partly cloudy/.test(w.now.condition) && t >= 12 && t <= 27 && wind < 25;
  return {
    lines, serious, sentiment: bad ? "bad" : good ? "good" : "neutral",
    skepticalBasis: modelOld || ctx.cache === "stale" || farOut,
    reliable: false,
    curious: Math.abs(f - t) >= 5 || (worst?.precipMm ?? 0) >= 20 || t >= 33 || t <= -15,
  };
}

export function quakeNotes(r: QuakeReport, now: number, message: string): Notes {
  const lines = ["Magnitudes and depths are preliminary and can be revised by the USGS."];
  if (!r.quakes.length) lines.push("No events matched in that window and area; the worldwide feed does not list the smallest quakes.");
  if (r.totalMatching > r.quakes.length) lines.push(`${r.totalMatching - r.quakes.length} more matching events exist but are not listed here.`);
  const biggest = Math.max(0, ...r.quakes.map(q => q.mag));
  const serious = r.quakes.some(q => q.mag >= 6 || q.tsunami || (q.alert && q.alert !== "green")) || sounds_distressed(message);
  void now;
  return { lines, serious, sentiment: null, skepticalBasis: false, reliable: r.quakes.length > 0, curious: biggest >= 5 };
}

export function newsNotes(r: NewsReport, now: number, message: string): Notes {
  const lines: string[] = [];
  r.items.forEach((i, n) => {
    const parts: string[] = [];
    if (i.claim) parts.push("it reports an announcement or someone's statement: that is their account, not something checked independently here");
    if (i.kind === "primary") parts.push("an official or primary source, which is still that body's own account");
    if (i.kind === "trade") parts.push("trade press");
    parts.push(i.alsoReportedBy.length ? `also carried by ${i.alsoReportedBy.join(", ")}` : "only this outlet in the feeds checked");
    if (i.disputed) parts.push(`the outlets' headlines give different figures (${i.disputed}); they may be measuring different things, so report it only as differing figures`);
    if (now - i.publishedAt > 36 * 3600_000) parts.push(`published ${days(now - i.publishedAt)} days ago, so not fresh`);
    if (i.serious) parts.push("a serious subject");
    lines.push(`Item ${n + 1}: ${parts.join("; ")}.`);
  });
  if (r.failed.length) lines.push(`${r.failed.length} of ${r.feedsAsked} feeds did not answer, so coverage may be incomplete.`);
  const items = r.items;
  return {
    lines, serious: items.some(i => i.serious) || sounds_distressed(message), sentiment: null,
    skepticalBasis: items.some(i => i.claim || i.disputed || (i.alsoReportedBy.length === 0 && i.kind !== "primary")),
    reliable: items.some(i => (i.kind === "primary" || i.alsoReportedBy.length >= 1) && !i.disputed),
    curious: items.some(i => i.disputed || i.alsoReportedBy.length >= 2),
  };
}
