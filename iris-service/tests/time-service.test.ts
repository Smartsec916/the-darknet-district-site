// The time service on its own (no server, no model): every expected value below was worked out by hand from the
// published zone rules, and every instant is fixed, so nothing here depends on when the tests run.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  allPlaces, analyzeTimeQuestion, checkReply, clock, clockPrompt, detectLang, enforceVerifiedTime, extractClockTimes,
  extractDates, isValidZone, offsetLabel, placeById, planTimeAnswer, readZone, timeRule, verifiedReply,
} from "../server/timeService";

const at = (iso: string) => Date.parse(iso);
const first = <T>(items: T[]) => items[0];
const read = (id: string, iso: string) => readZone(at(iso), placeById(id)!);
const hm = (id: string, iso: string) => { const r = read(id, iso); return `${r.dateKey} ${r.hm} ${offsetLabel(r.offsetMinutes)}`; };

// The reported bug: at 13:50 UTC Beijing is 21:50, never 14:50
const BUG = "2026-10-30T13:50:00Z";

test("UTC to Beijing and to Sacramento", () => {
  assert.equal(hm("beijing", BUG), "2026-10-30 21:50 UTC+8");
  assert.equal(hm("china", "2026-10-30T13:57:00Z"), "2026-10-30 21:57 UTC+8");
  assert.equal(hm("sacramento", BUG), "2026-10-30 06:50 UTC-7");      // daylight time until 1 November 2026
  assert.equal(hm("sacramento", "2026-11-01T15:22:00Z"), "2026-11-01 07:22 UTC-8"); // standard time after
  assert.equal(hm("utc", BUG), "2026-10-30 13:50 UTC+0");
});

test("daylight saving transitions, both directions, both hemispheres", () => {
  // United States, autumn: 02:00 PDT on 1 November 2026 becomes 01:00 PST
  assert.equal(hm("losangeles", "2026-11-01T08:59:00Z"), "2026-11-01 01:59 UTC-7");
  assert.equal(hm("losangeles", "2026-11-01T09:00:00Z"), "2026-11-01 01:00 UTC-8");
  assert.equal(hm("newyork", "2026-11-01T05:59:00Z"), "2026-11-01 01:59 UTC-4");
  assert.equal(hm("newyork", "2026-11-01T06:00:00Z"), "2026-11-01 01:00 UTC-5");
  // United States, spring: 02:00 PST on 8 March 2026 jumps to 03:00 PDT
  assert.equal(hm("sacramento", "2026-03-08T09:59:00Z"), "2026-03-08 01:59 UTC-8");
  assert.equal(hm("sacramento", "2026-03-08T10:00:00Z"), "2026-03-08 03:00 UTC-7");
  // Europe: London leaves summer time on 25 October 2026
  assert.equal(hm("london", "2026-10-25T00:59:00Z"), "2026-10-25 01:59 UTC+1");
  assert.equal(hm("london", "2026-10-25T01:00:00Z"), "2026-10-25 01:00 UTC+0");
  // Southern hemisphere: Sydney starts summer time on 4 October 2026
  assert.equal(hm("sydney", "2026-10-03T15:59:00Z"), "2026-10-04 01:59 UTC+10");
  assert.equal(hm("sydney", "2026-10-03T16:00:00Z"), "2026-10-04 03:00 UTC+11");
  // Arizona keeps standard time all year
  assert.equal(hm("phoenix", "2026-07-01T12:00:00Z"), "2026-07-01 05:00 UTC-7");
  assert.equal(hm("phoenix", "2026-12-01T12:00:00Z"), "2026-12-01 05:00 UTC-7");
  // The time difference itself changes with daylight saving
  const diff = (iso: string) => planTimeAnswer("time difference between Beijing and Sacramento", at(iso))!;
  assert.match(verifiedReply(diff(BUG), first), /Beijing is 15 hours ahead of Sacramento/);
  assert.match(verifiedReply(diff("2026-11-01T15:22:00Z"), first), /Beijing is 16 hours ahead of Sacramento/);
});

test("dates change at midnight in each zone, not at midnight UTC", () => {
  assert.equal(hm("beijing", "2026-10-30T15:59:00Z"), "2026-10-30 23:59 UTC+8");
  assert.equal(hm("beijing", "2026-10-30T16:00:00Z"), "2026-10-31 00:00 UTC+8");
  assert.equal(read("beijing", "2026-10-30T16:00:00Z").weekday, 6); // Saturday
  assert.equal(hm("sacramento", "2026-10-31T06:30:00Z"), "2026-10-30 23:30 UTC-7"); // still the day before UTC
  assert.equal(hm("tokyo", "2026-12-31T15:00:00Z"), "2027-01-01 00:00 UTC+9");   // a new year
});

test("half-hour and 45-minute offsets", () => {
  const t = "2026-10-30T18:20:00Z";
  assert.equal(hm("kolkata", t), "2026-10-30 23:50 UTC+5:30");
  assert.equal(hm("kathmandu", t), "2026-10-31 00:05 UTC+5:45");
  assert.equal(hm("tehran", t), "2026-10-30 21:50 UTC+3:30");
  assert.equal(hm("adelaide", t), "2026-10-31 04:50 UTC+10:30");
  assert.equal(hm("stjohns", t), "2026-10-30 15:50 UTC-2:30");
  assert.equal(hm("chatham", t), "2026-10-31 08:05 UTC+13:45");
  const p = planTimeAnswer("What's the time difference between Kathmandu and Kolkata?", at(t))!;
  assert.match(verifiedReply(p, first), /Kathmandu is 15 minutes ahead of Kolkata/);
  assert.match(verifiedReply(planTimeAnswer("What time is it in Kathmandu?", at(t))!, first), /00:05 \(12:05 AM\).*UTC\+5:45/);
});

test("across the international date line", () => {
  const t = "2026-10-30T10:30:00Z";
  assert.equal(hm("kiritimati", t), "2026-10-31 00:30 UTC+14");
  assert.equal(hm("pagopago", t), "2026-10-29 23:30 UTC-11");
  assert.equal(hm("apia", t), "2026-10-30 23:30 UTC+13");
  const p = planTimeAnswer("What's the time difference between Kiritimati and Pago Pago?", at(t))!;
  assert.match(verifiedReply(p, first), /Kiritimati \(Kiribati\) is 25 hours ahead of American Samoa/);
  const tomorrow = planTimeAnswer("Is it tomorrow in Kiritimati compared to American Samoa?", at(t))!;
  assert.match(verifiedReply(tomorrow, first), /^.+ Yes\. In Kiritimati .* already Saturday, 31 October 2026, 00:30, while American Samoa is still on Thursday, 29 October 2026\./);
});

test("places are recognized in English, Chinese (both scripts), Japanese, Spanish and Russian", () => {
  const cases: Array<[string, string[], string]> = [
    ["现在是北京时间几点?", ["beijing"], "zh-Hans"],
    ["现在在中国是几点?", ["china"], "zh-Hans"],
    ["現在在中國是幾點？", ["china"], "zh-Hant"],
    ["台北現在幾點？", ["taipei"], "zh-Hant"],
    ["萨克拉门托现在几点", ["sacramento"], "zh-Hans"],
    ["美国加州现在几点", ["california"], "zh-Hans"],
    ["加州萨克拉门托现在几点？", ["sacramento"], "zh-Hans"],
    ["东京现在几点？", ["tokyo"], "zh-Hans"],
    ["東京は今何時ですか？", ["tokyo"], "ja"],
    ["ロンドンは今何時？", ["london"], "ja"],
    ["カトマンズの現在時刻は？", ["kathmandu"], "ja"],
    ["What time is it in Sacramento, California?", ["sacramento"], "en"],
    ["what's the time in new york", ["newyork"], "en"],
    ["What time is it in Sydney right now?", ["sydney"], "en"],
    ["Tokyo time?", ["tokyo"], "en"],
    ["¿Qué hora es en Pekín?", ["beijing"], "es"],
    ["¿Qué hora es en Nueva York?", ["newyork"], "es"],
    ["¿Qué hora es en Londres?", ["london"], "es"],
    ["Который час в Москве?", ["moscow"], "ru"],
    ["Сколько времени сейчас в Пекине?", ["beijing"], "ru"],
    ["Который час в Токио?", ["tokyo"], "ru"],
    ["Сколько сейчас времени в Сиднее?", ["sydney"], "ru"],
    ["What time is it in Tokyo and London?", ["tokyo", "london"], "en"],
    ["What time is it in UTC+8?", ["offset:UTC+8"], "en"],
    ["What time is it in Asia/Ulaanbaatar?", ["zone:Asia/Ulaanbaatar"], "en"],
  ];
  for (const [text, ids, lang] of cases) {
    const q = analyzeTimeQuestion(text);
    assert.ok(q, text);
    assert.deepEqual(q!.places.map(p => p.id), ids, text);
    assert.equal(q!.lang, lang, text);
    assert.equal(q!.ambiguous, null, text);
  }
});

test("what kind of question it is: time, date, is-it-tomorrow, difference; and what is not a time question", () => {
  const kinds: Array<[string, string]> = [
    ["今天中国的日期是几号？", "date"], ["What's today's date in China?", "date"], ["中国今天几号", "date"],
    ["¿Qué fecha es hoy en Tokio?", "date"], ["Какое сегодня число в Москве?", "date"], ["東京は今日何日？", "date"],
    ["Is it tomorrow in Japan?", "tomorrow"], ["日本已经是明天了吗？", "tomorrow"], ["¿Ya es mañana en Japón?", "tomorrow"],
    ["В Японии уже завтра?", "tomorrow"], ["日本はもう明日？", "tomorrow"],
    ["What's the time difference between London and Tokyo?", "difference"], ["北京和伦敦的时差是多少？", "difference"],
    ["How many hours ahead is Sydney of London?", "difference"], ["東京とロンドンの時差は？", "difference"],
    ["¿Cuál es la diferencia horaria entre Madrid y Lima?", "difference"], ["Какая разница во времени между Москвой и Токио?", "difference"],
  ];
  for (const [text, kind] of kinds) assert.equal(analyzeTimeQuestion(text)?.kind, kind, text);
  for (const text of ["What time do you open?", "你们几点关门？", "I don't have time for this", "Tell me about Tokyo", "¿A qué hora abren?", "I'm behind on my work", ""]) {
    assert.equal(analyzeTimeQuestion(text), null, text);
  }
});

test("a missing place: she asks where the visitor is and never guesses from their language", () => {
  for (const text of ["What time is it?", "现在几点了？", "今何時？", "¿Qué hora es?", "Который час?"]) {
    const p = planTimeAnswer(text, at(BUG))!;
    assert.equal(p.outcome, "ask_local", text);
    assert.equal(p.readings.length, 0, text); // a Chinese question does not become Beijing time
    const reply = verifiedReply(p, first);
    assert.match(reply, /13:50/, text);       // UTC, labelled as UTC
    assert.match(reply, /UTC/, text);
    assert.doesNotMatch(reply, /21:50|22:50|06:50/, text);
    assert.ok(checkReply(reply, p).ok, text);
  }
  // A difference needs two places; with one, she asks for the other
  assert.equal(planTimeAnswer("What's the time difference with Tokyo?", at(BUG))!.outcome, "ask_local");
});

test("ambiguous places: she asks which one, and a city settles a country", () => {
  const ask = (text: string) => planTimeAnswer(text, at(BUG))!;
  for (const [text, options] of [
    ["What time is it in Portland?", ["portlandor", "portlandme"]],
    ["What time is it in the US?", ["newyork", "chicago", "denver", "losangeles", "anchorage", "honolulu"]],
    ["Который час в России?", ["moscow", "yekaterinburg", "novosibirsk", "vladivostok"]],
    ["澳大利亚现在几点？", ["sydney", "brisbane", "adelaide", "perth"]],
    ["What time is it in Georgia?", ["atlanta", "tbilisi"]],
    ["¿Qué hora es en San José?", ["sanjoseca", "sanjosecr"]],
  ] as Array<[string, string[]]>) {
    const p = ask(text);
    assert.equal(p.outcome, "ask_ambiguous", text);
    assert.deepEqual(p.query.ambiguous!.options.map(o => o.id), options, text);
    const reply = verifiedReply(p, first);
    assert.equal(extractClockTimes(reply).length, 0, text); // no time given for an unknown choice
  }
  assert.match(verifiedReply(ask("What time is it in Portland?"), first), /Portland, Oregon; Portland, Maine\. Which one/);
  assert.deepEqual(ask("What time is it in Portland, Oregon?").readings.map(r => r.place.id), ["portlandor"]);
  assert.deepEqual(ask("What time is it in Portland Maine?").readings.map(r => r.place.id), ["portlandme"]);
  assert.deepEqual(ask("Который час в России, в Москве?").readings.map(r => r.place.id), ["moscow"]);
  assert.deepEqual(ask("What time is it in Washington DC?").readings.map(r => r.place.id), ["washingtondc"]);
  assert.equal(ask("What time is it in Washington?").outcome, "ask_ambiguous");
});

test("an unknown place or an invalid zone id: she asks instead of inventing a time", () => {
  for (const text of ["What time is it in Ulaanbaatar?", "What time is it in Night City?", "time in Mars/Olympus?", "¿Qué hora es en Asunción?", "Который час в Улан-Баторе?"]) {
    const p = planTimeAnswer(text, at(BUG))!;
    assert.equal(p.outcome, "ask_unknown", text);
    const reply = verifiedReply(p, first);
    assert.match(reply, /13:50/, text);
    assert.equal(extractClockTimes(reply).length, 1, text); // only the UTC reference
  }
  assert.equal(isValidZone("Asia/Kathmandu"), true);
  assert.equal(isValidZone("Mars/Olympus"), false);
  assert.equal(isValidZone(""), false);
  assert.equal(isValidZone("Asia/Kathmandu; DROP TABLE"), false);
  assert.throws(() => readZone(at(BUG), { id: "x", zone: "Mars/Olympus", city: true, labels: ["Mars"] }), RangeError);
  assert.throws(() => readZone(Number.NaN, placeById("tokyo")!), RangeError);
  // A valid zone typed directly works
  assert.equal(hm("utc", BUG), "2026-10-30 13:50 UTC+0");
  const typed = planTimeAnswer("What time is it in Asia/Ulaanbaatar?", at(BUG))!;
  assert.equal(typed.outcome, "answer");
  assert.equal(typed.readings[0].hm, "21:50");
});

test("every zone in the place list is a real IANA zone", () => {
  for (const p of allPlaces()) assert.ok(isValidZone(p.zone), `${p.id}: ${p.zone}`);
  assert.ok(allPlaces().length > 80);
});

test("differences between two places, in every supported language", () => {
  const t = at(BUG);
  const expect: Array<[string, RegExp]> = [
    ["What's the time difference between Beijing and Sacramento?", /Beijing is 15 hours ahead of Sacramento right now: 21:50 .* 06:50/],
    ["What's the time difference between Sacramento and Beijing?", /Sacramento is 15 hours behind Beijing/],
    ["北京和萨克拉门托的时差是多少？", /北京比萨克拉门托快15小时：北京现在是.*21:50，萨克拉门托是.*06:50/],
    ["北京和舊金山的時差是多少？", /北京比舊金山快15小時/],
    ["東京とロンドンの時差は？", /東京はロンドンより9時間進んでいます/],
    ["¿Cuál es la diferencia horaria entre Madrid y Lima?", /Madrid va 6 horas por delante de Lima/],
    ["Какая разница во времени между Москвой и Токио?", /Москва позади на 6 часов/],
    ["time difference between Sacramento and Los Angeles", /Sacramento and Los Angeles are on the same time right now: 06:50/],
  ];
  for (const [text, re] of expect) {
    const p = planTimeAnswer(text, t)!;
    assert.equal(p.outcome, "answer", text);
    const reply = verifiedReply(p, first);
    assert.match(reply, re, text);
    assert.ok(checkReply(reply, p).ok, text);
  }
});

test("today's date and is-it-tomorrow answers", () => {
  const late = at("2026-10-30T15:30:00Z"); // 00:30 on Saturday in Tokyo, still Friday in UTC
  const q1 = planTimeAnswer("Is it tomorrow in Japan?", late)!;
  assert.match(verifiedReply(q1, first), /Yes\. In Japan it's already Saturday, 31 October 2026, 00:30, while UTC is still on Friday, 30 October 2026\./);
  const q2 = planTimeAnswer("Is it tomorrow in Japan?", at(BUG))!;
  assert.match(verifiedReply(q2, first), /No\. Japan and UTC are on the same date/);
  const q3 = planTimeAnswer("日本已经是明天了吗？", late)!;
  assert.match(verifiedReply(q3, first), /是的。日本已经是2026年10月31日星期六 00:30了/);
  const q4 = planTimeAnswer("Is it tomorrow in Tokyo compared to Sacramento?", late)!;
  assert.match(verifiedReply(q4, first), /Yes\. In Tokyo it's already Saturday, 31 October 2026, 00:30, while Sacramento is still on Friday, 30 October 2026\./);
  const d = planTimeAnswer("今天中国的日期是几号？", at("2026-10-30T16:05:00Z"))!;
  assert.match(verifiedReply(d, first), /中国今天是2026年10月31日星期六，当地时间00:05（UTC\+8）/);
  const es = planTimeAnswer("¿Qué fecha es hoy en Tokio?", late)!;
  assert.match(verifiedReply(es, first), /En Tokio hoy es sábado, 31 de octubre de 2026; hora local 00:30/);
});

test("the safeguard: a reply that contradicts the verified time is caught and replaced", () => {
  const p = planTimeAnswer("现在是北京时间几点?", at(BUG))!;
  assert.equal(p.readings[0].hm, "21:50");
  // What she actually said before the fix
  for (const wrong of ["现在北京时间是14:50，夜色正好。", "北京时间下午2点50分。", "It's 14:50 in Beijing.", "北京现在是两点五十分。", "It's 2:50 PM in Beijing."]) {
    const c = checkReply(wrong, p);
    assert.equal(c.ok, false, wrong);
    const fixed = enforceVerifiedTime(wrong, p, first);
    assert.equal(fixed.replaced, true, wrong);
    assert.match(fixed.text, /21:50/);
    assert.doesNotMatch(fixed.text, /14:50/);
  }
  for (const right of ["北京现在是21:50。", "北京时间晚上9点50分，夜猫子。", "It's 9:50 PM in Beijing, runner.", "Beijing: 21:50 on Friday, 30 October."]) {
    assert.ok(checkReply(right, p).ok, right);
    assert.equal(enforceVerifiedTime(right, p).text, right);
  }
  // Leaving the time out is not an answer
  assert.equal(checkReply("Beijing never sleeps, runner.", p).ok, false);
  // A wrong date is caught too
  assert.equal(checkReply("Beijing: 21:50 on 31 October.", p).ok, false);
  assert.equal(checkReply("北京现在是10月31日 21:50。", p).ok, false);
  // An offset is not a clock time; a duration is not either
  const k = planTimeAnswer("What time is it in Kathmandu?", at(BUG))!;
  assert.ok(checkReply("Kathmandu: 19:35 (UTC+5:45).", k).ok);
  const d = planTimeAnswer("北京和萨克拉门托的时差是多少？", at(BUG))!;
  assert.ok(checkReply("北京比萨克拉门托快15小时，北京21:50。", d).ok);
  // When she must ask, any local time she invents is caught
  const local = planTimeAnswer("现在几点了？", at(BUG))!;
  assert.equal(checkReply("你那边应该是晚上9点50分吧。", local).ok, false);
  assert.ok(checkReply("现在是UTC 13:50，你在哪个城市？", local).ok);
});

test("the verified answer always passes its own check, for every place, language and kind", () => {
  const instants = ["2026-10-30T13:50:00Z", "2026-10-30T15:59:00Z", "2026-11-01T09:00:00Z", "2026-03-08T10:00:00Z", "2026-12-31T23:59:00Z"];
  const questions = [
    "What time is it in {en}?", "{zh}现在几点？", "{ja}は今何時？", "¿Qué hora es en {es}?", "What's the date in {en}?",
    "Is it tomorrow in {en}?", "What's the time difference between {en} and London?",
  ];
  const labels = (id: string) => placeById(id)!.labels;
  for (const iso of instants) for (const id of ["beijing", "sacramento", "tokyo", "kathmandu", "chatham", "kiritimati", "pagopago", "stjohns", "sydney"]) {
    const [en, zh, , ja, es] = labels(id);
    for (const template of questions) {
      const text = template.replace("{en}", en).replace("{zh}", zh).replace("{ja}", ja).replace("{es}", es);
      const p = planTimeAnswer(text, at(iso));
      assert.ok(p, text);
      if (p!.outcome !== "answer") continue;
      for (const pick of [first, <T>(items: T[]) => items[items.length - 1]]) {
        const reply = verifiedReply(p!, pick);
        assert.ok(checkReply(reply, p!).ok, `${iso} ${text}: ${reply} ${checkReply(reply, p!).problems}`);
      }
    }
  }
});

test("written times and dates are read correctly", () => {
  assert.deepEqual(extractClockTimes("21:50").map(t => t.minutes), [[1310]]);
  assert.deepEqual(extractClockTimes("9:50 PM").map(t => t.minutes), [[1310]]);
  assert.deepEqual(extractClockTimes("9:50").map(t => t.minutes), [[590, 1310]]);
  assert.deepEqual(extractClockTimes("晚上9点半").map(t => t.minutes), [[1290]]);
  assert.deepEqual(extractClockTimes("二十一点五十分").map(t => t.minutes), [[1310]]);
  assert.deepEqual(extractClockTimes("21時50分").map(t => t.minutes), [[1310]]);
  assert.deepEqual(extractClockTimes("２１：５０").map(t => t.minutes), [[1310]]); // full-width
  assert.deepEqual(extractClockTimes("UTC+5:45, 5小时45分钟, 5時間, 时差"), []);
  assert.deepEqual(extractDates("Friday, 30 October 2026; November 1st; 1 de noviembre; 1 ноября; 11月1日"), ["10-30", "11-01", "11-01", "11-01", "11-01"]);
});

test("the reply language follows the visitor's script, not a guess", () => {
  assert.equal(detectLang("现在几点？"), "zh-Hans");
  assert.equal(detectLang("現在幾點？"), "zh-Hant");
  assert.equal(detectLang("今何時ですか"), "ja");
  assert.equal(detectLang("今何時"), "ja");
  assert.equal(detectLang("¿Qué hora es?"), "es");
  assert.equal(detectLang("Который час?"), "ru");
  assert.equal(detectLang("what time is it"), "en");
});

test("what the model is told: the clock, the verified values, and the rule", () => {
  const p = planTimeAnswer("Hey, what time is it in Beijing and how's the District tonight? Anything new?", at(BUG))!;
  assert.equal(p.direct, false); // a longer message goes to the model, with the values to copy
  const prompt = clockPrompt(at(BUG), p);
  assert.match(prompt, /it is 2026-10-30 13:50 UTC/);
  assert.match(prompt, /Beijing \(Asia\/Shanghai, UTC\+8\): 2026-10-30 21:50/);
  assert.match(prompt, /Never present UTC as their local time/);
  assert.match(timeRule(p), /ONLY from VERIFIED CLOCK/);
  const none = clockPrompt(at(BUG), null);
  assert.match(none, /2026-10-30 13:50 UTC/);
  assert.doesNotMatch(none, /VERIFIED CLOCK for the places/);
  // A hypothetical time of the visitor's own is not checked against the current time
  const h = planTimeAnswer("If it's 9am in London, what time is it in Tokyo?", at(BUG))!;
  assert.equal(h.query.hypothetical, true);
  assert.equal(h.direct, false);
  assert.equal(h.guard, false);
});

test("the current time is read fresh on every call, from the system clock", () => {
  const original = clock.now;
  try {
    // The real clock: within a second of Date.now()
    const before = Date.now();
    const p = planTimeAnswer("What time is it in UTC?")!;
    assert.ok(p.nowMs >= before && p.nowMs <= Date.now());
    // Each call reads the clock again: nothing is captured at import or reused between messages
    const ticks = [at("2026-10-30T13:50:00Z"), at("2026-10-30T13:51:00Z"), at("2026-10-30T16:00:00Z")];
    let calls = 0;
    clock.now = () => ticks[calls++];
    const answers = [0, 1, 2].map(() => planTimeAnswer("现在是北京时间几点?")!.readings[0]);
    assert.equal(calls, 3);
    assert.deepEqual(answers.map(r => `${r.dateKey} ${r.hm}`), ["2026-10-30 21:50", "2026-10-30 21:51", "2026-10-31 00:00"]);
  } finally {
    clock.now = original;
  }
});

test("no current time is hard-coded in the service", () => {
  const source = fs.readFileSync(path.join(import.meta.dirname, "..", "server", "timeService.ts"), "utf8");
  assert.doesNotMatch(source, /new Date\(\s*\d/);                 // no fixed instant
  assert.doesNotMatch(source, /Date\.UTC\(\s*\d/);                 // no fixed date
  assert.doesNotMatch(source, /\b20\d\d-\d\d-\d\dT?\d/);           // no timestamp literal
  assert.doesNotMatch(source, /[+-]\s*8\s*\*\s*(?:60|3600)/);      // no hand-written Beijing offset
  assert.doesNotMatch(source, /getTimezoneOffset|toLocaleTimeString\(\)/); // never the server's own zone
  // And readings agree with an independent conversion at many instants
  for (let i = 0; i < 200; i++) {
    const ms = at("2020-01-01T00:00:00Z") + Math.floor(i * 7_919_993.7 * 1000) % (10 * 365 * 86_400_000);
    for (const id of ["beijing", "sacramento", "kathmandu", "chatham", "stjohns"]) {
      const r = readZone(ms, placeById(id)!);
      const expected = new Date(ms).toLocaleString("en-CA", { timeZone: r.zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
      assert.equal(`${r.dateKey}, ${r.hm}`, expected.replace(/\s+/g, " "), `${id} at ${new Date(ms).toISOString()}`);
    }
  }
});
