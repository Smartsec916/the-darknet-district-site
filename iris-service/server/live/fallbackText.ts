// The plain replacement text used when a model reply is thrown away because a number in it was wrong. It must be in the
// visitor's language and script: it used to treat every CJK message as Simplified Chinese, so a Japanese visitor got
// "直接来自新闻源的标题" (found in the 2026-11-02 multilingual evaluation). No model involved, so it is fixed text plus the data.
import { detectLang, type Lang } from "../timeService";

export function fallbackLanguage(message: string): Lang {
  const lang = detectLang(message);
  if (lang === "en" && /[¿¡ñáéíóú]|\b(?:noticias|terremotos?|sismos?|tiempo|clima|pron[oó]stico)\b/i.test(message)) return "es";
  return lang;
}

type Table<T> = Record<Lang, T>;

const NEWS_HEAD: Table<string> = {
  en: "Straight from the feeds, nothing added:",
  "zh-Hans": "直接来自新闻源的标题（未加修饰）：",
  "zh-Hant": "直接來自新聞來源的標題（未加修飾）：",
  ja: "ニュース元の見出しをそのまま載せます（脚色なし）：",
  es: "Directo de las fuentes, sin añadir nada:",
  ru: "Прямо из источников, без добавлений:",
};
export const newsFallbackText = (message: string, list: string): string => `${NEWS_HEAD[fallbackLanguage(message)]}\n${list}`;

const QUAKE: Table<{ head: (scope: string) => string; none: string; tail: string }> = {
  en: { head: s => `Latest from the US Geological Survey (${s}): `, none: "nothing matching in that window", tail: ". Official numbers, no embellishment." },
  "zh-Hans": { head: s => `美国地质调查局（USGS）的最新记录（${s}）：`, none: "该时段内没有符合条件的地震", tail: "。" },
  "zh-Hant": { head: s => `美國地質調查局（USGS）的最新紀錄（${s}）：`, none: "該時段內沒有符合條件的地震", tail: "。" },
  ja: { head: s => `米国地質調査所（USGS）の最新記録（${s}）：`, none: "その期間に該当する地震はありません", tail: "。" },
  es: { head: s => `Lo último del Servicio Geológico de EE. UU. (${s}): `, none: "nada que coincida en ese periodo", tail: ". Cifras oficiales, sin adornos." },
  ru: { head: s => `Последние данные Геологической службы США (${s}): `, none: "в этот период ничего подходящего нет", tail: ". Официальные цифры, без прикрас." },
};
export const quakeFallbackText = (message: string, scope: string, list: string): string => {
  const t = QUAKE[fallbackLanguage(message)];
  return `${t.head(scope)}${list || t.none}${t.tail}`;
};

interface WeatherParts { place: string; now: string; feels: string; condition: string; high: string | null; low: string | null; updated: string }
const WEATHER: Table<(p: WeatherParts) => string> = {
  en: p => `${p.place} right now: ${p.now}, feels like ${p.feels}, ${p.condition}.${p.high ? ` Today's high ${p.high}, low ${p.low ?? "n/a"}.` : ""} Straight from MET Norway, updated ${p.updated}. I'd rather be plain than wrong.`,
  "zh-Hans": p => `${p.place}现在${p.now}，体感${p.feels}，${p.condition}。${p.high ? `今天最高${p.high}，最低${p.low ?? "未知"}。` : ""}数据来源：MET Norway，更新于 ${p.updated}。`,
  "zh-Hant": p => `${p.place}現在${p.now}，體感${p.feels}，${p.condition}。${p.high ? `今天最高${p.high}，最低${p.low ?? "未知"}。` : ""}資料來源：MET Norway，更新於 ${p.updated}。`,
  ja: p => `${p.place}の現在の気温は${p.now}、体感${p.feels}、${p.condition}。${p.high ? `今日の最高${p.high}、最低${p.low ?? "不明"}。` : ""}出典：MET Norway、更新 ${p.updated}。`,
  es: p => `${p.place} ahora: ${p.now}, sensación de ${p.feels}, ${p.condition}.${p.high ? ` Hoy máxima de ${p.high} y mínima de ${p.low ?? "n/d"}.` : ""} Directo de MET Norway, actualizado ${p.updated}. Prefiero ser claro a equivocarme.`,
  ru: p => `${p.place} сейчас: ${p.now}, ощущается как ${p.feels}, ${p.condition}.${p.high ? ` Сегодня максимум ${p.high}, минимум ${p.low ?? "нет данных"}.` : ""} Данные MET Norway, обновлено ${p.updated}. Лучше просто и точно, чем красиво и неверно.`,
};
export const weatherFallbackText = (message: string, p: WeatherParts): string => WEATHER[fallbackLanguage(message)](p);
