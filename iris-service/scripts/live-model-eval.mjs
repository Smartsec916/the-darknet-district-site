// Runs fixed Iris conversations against the REAL OpenAI model, entirely on this machine, and writes a Markdown report.
//
//   Windows: powershell -ExecutionPolicy Bypass -File scripts\run-live-model-eval.ps1        (keeps the key out of chat, history and files)
//   Direct:  OPENAI_API_KEY=sk-... node scripts/live-model-eval.mjs [--langs en,ja] [--cap 0.85] [--out report.md]
//   Check the safety machinery without a key or any spending:  node scripts/live-model-eval.mjs --selftest
//
// What keeps it away from production, in layers (all checked at the start of every run, and the run stops if one fails):
//   1. The server is started with an IN-MEMORY database (IRIS_TEST_DB=pglite) and DATABASE_URL, the mail, report, admin and
//      Render variables are blanked, so there is nothing to connect to.
//   2. A network guard (tests/helpers/network-guard.cjs) is preloaded into that server: any outbound connection except this
//      machine and the public data providers (MET Norway, weather.gov, USGS, OpenStreetMap, the news feeds) is refused,
//      including Neon, Render, thedarknetdistrict.com, Brevo and Firebase. Proven by a probe before the run.
//   3. OpenAI traffic goes through a local proxy in THIS process that only forwards to api.openai.com, adds up the tokens
//      and stops the run at a spending cap. The key reaches only that proxy's upstream request; it is never printed or written.
//   There is no --base option: this script cannot be pointed at a running service.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { startBuiltServer } from "../tests/helpers/server.mjs";
import { defaultReportName, writeNewReport } from "./eval-report-path.mjs";

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const flag = name => args.includes(name);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUARD = path.join(root, "tests", "helpers", "network-guard.cjs");
const selftest = flag("--selftest");
const capUsd = Number(opt("--cap", selftest ? "0.002" : "0.85"));
const pause = Number(opt("--pause", selftest ? "50" : "1500"));
let UPSTREAM = "https://api.openai.com/v1"; // only --selftest may swap this for a loopback fake, below
const KEY = selftest ? "sk-selftest-not-a-real-key" : process.env.OPENAI_API_KEY;
if (!KEY) { console.error("OPENAI_API_KEY is not set. Use scripts\\run-live-model-eval.ps1 (see docs/IRIS-LIVE-MODEL-EVAL.md), or --selftest."); process.exit(2); }

// ---- scenarios: one session per language, so "and tomorrow?" has something to refer to ---------------------------------------
const KINDS = ["weather", "followUp", "quakes", "news", "time", "ambiguousPlace", "unknownPlace", "emergency", "corporate", "control"];
const SCENARIOS = {
  en: ["What's the weather in Sacramento right now?", "And tomorrow?", "Any earthquakes today?", "What's the latest tech news?", "What time is it in Tokyo, and what's the date there?", "What's the weather in Portland?", "What's the weather in Atlantis?", "I think a big earthquake just hit near me. What should I do?", "What did Apple announce today?", "Hi Iris, what do you do around here?"],
  "zh-Hans": ["萨克拉门托现在天气怎么样？", "那明天呢？", "今天有地震吗？", "最新的科技新闻是什么？", "东京现在几点？今天是几号？", "波特兰天气怎么样？", "亚特兰蒂斯的天气怎么样？", "我觉得附近刚发生了一场大地震，我该怎么办？", "苹果今天发布了什么？", "嗨 Iris，你在这儿是做什么的？"],
  "zh-Hant": ["沙加緬度現在天氣如何？", "那明天呢？", "今天有地震嗎？", "最新的科技新聞是什麼？", "東京現在幾點？今天幾號？", "波特蘭的天氣如何？", "亞特蘭提斯的天氣如何？", "我覺得附近剛發生了大地震，我該怎麼辦？", "蘋果今天發表了什麼？", "嗨 Iris，你在這裡是做什麼的？"],
  ja: ["サクラメントの今の天気は？", "明日は？", "今日、地震はあった？", "最新のテックニュースは？", "ロンドンは今何時？日付も教えて。", "ポートランドの天気は？", "アトランティスの天気は？", "近くで大きな地震があった気がします。どうすればいい？", "今日、Appleは何を発表した？", "こんにちは Iris、ここで何をしているの？"],
  es: ["¿Qué tiempo hace ahora en Sacramento?", "¿Y mañana?", "¿Ha habido terremotos hoy?", "¿Cuáles son las últimas noticias de tecnología?", "¿Qué hora es en Tokio y qué fecha es allí?", "¿Qué tiempo hace en Portland?", "¿Qué tiempo hace en la Atlántida?", "Creo que acaba de haber un terremoto fuerte cerca de mí. ¿Qué hago?", "¿Qué anunció Apple hoy?", "Hola Iris, ¿qué haces por aquí?"],
  ru: ["Какая сейчас погода в Сакраменто?", "А завтра?", "Были сегодня землетрясения?", "Какие последние новости технологий?", "Сколько сейчас времени в Токио и какое там число?", "Какая погода в Портленде?", "Какая погода в Атлантиде?", "Мне кажется, рядом только что было сильное землетрясение. Что мне делать?", "Что сегодня анонсировала Apple?", "Привет, Iris, чем ты тут занимаешься?"],
};
const DOMAIN_WORDS = {
  weather: /weather|forecast|rain|temperature|°|天气|天氣|氣溫|气温|天気|気温|tiempo|clima|погод|температур/i,
  news: /headline|news|noticias|новост|ニュース|新闻|新聞/i,
  quake: /earthquake|quake|terremoto|sismo|землетряс|地震/i,
};
const OWN_DOMAIN = { weather: "weather", followUp: "weather", ambiguousPlace: "weather", unknownPlace: "weather", quakes: "quake", emergency: "quake", news: "news", corporate: "news", time: null, control: null };
const SCRIPT = { en: /[A-Za-z]/, "zh-Hans": /[一-鿿]/, "zh-Hant": /[一-鿿]/, ja: /[぀-ヿ]/, es: /[¿¡áéíóúñ]|\b(el|la|es|en|de|que)\b/i, ru: /[Ѐ-ӿ]/ };
const HEDGE = /allegedly|reportedly|according to|apparently|supposedly|claims?\b|says\b|据|據|称|稱|报道|報導|によると|とされる|報じ|主張|supuestamente|según|presuntamente|afirma|dice\b|якобы|по данным|утверждает|сообщает|заявляет/i;
const OUTLET = /bbc|guardian|npr|nasa|cisa|bleeping|ars technica|\bars\b/i;
const JOKE = /lol|haha|😂|🤣|哈哈|jaja|хаха/i;
const AIR = /\b(AQI|PM ?2\.5|PM10|air quality index)\b/i;
const SIMPL = /[这们还说为时东问发现从长点]/, TRAD = /[這們還說為時東問發現從長點]/;
const langs = (opt("--langs") ?? Object.keys(SCENARIOS).join(",")).split(",").filter(l => SCENARIOS[l]);
if (!langs.length) throw new Error("no known language in --langs");

// ---- 3. OpenAI proxy with a spending cap -------------------------------------------------------------------------------------
const PRICE = { "gpt-4o": [2.5, 10] }, PRICE_UNKNOWN = [5, 15]; // USD per million tokens (input, output); unknown models are priced high on purpose
const spend = { usd: 0, calls: 0, inTokens: 0, outTokens: 0, capped: false, authFailures: 0, upstreamErrors: 0, models: new Set() };
const proxy = http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  if (spend.usd >= capUsd) { spend.capped = true; res.writeHead(429, { "content-type": "application/json" }); return res.end(JSON.stringify({ error: { message: "eval spending cap reached", type: "insufficient_quota" } })); }
  const headers = { "content-type": req.headers["content-type"] ?? "application/json" };
  if (req.headers.authorization) headers.authorization = req.headers.authorization;
  let upstream;
  try { upstream = await fetch(UPSTREAM + req.url.replace(/^\/v1/, ""), { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined, signal: AbortSignal.timeout(60_000) }); }
  catch { spend.upstreamErrors++; res.writeHead(502, { "content-type": "application/json" }); return res.end("{}"); }
  const text = await upstream.text();
  if (upstream.status === 401 || upstream.status === 403) spend.authFailures++;
  if (upstream.status >= 500) spend.upstreamErrors++;
  try {
    const body = JSON.parse(text);
    if (body.usage) {
      const [pin, pout] = PRICE[String(body.model).replace(/-\d{4}-\d{2}-\d{2}$/, "")] ?? PRICE_UNKNOWN;
      spend.calls++; spend.inTokens += body.usage.prompt_tokens ?? 0; spend.outTokens += body.usage.completion_tokens ?? 0; spend.models.add(body.model);
      spend.usd += ((body.usage.prompt_tokens ?? 0) * pin + (body.usage.completion_tokens ?? 0) * pout) / 1e6;
    }
  } catch { /* not JSON: nothing to count */ }
  res.writeHead(upstream.status, { "content-type": upstream.headers.get("content-type") ?? "application/json" });
  res.end(text);
});
await new Promise(r => proxy.listen(0, "127.0.0.1", r));
const proxyUrl = `http://127.0.0.1:${proxy.address().port}/v1`;

// In a self-test the "upstream" is a local fake that answers like OpenAI with a usage block.
let fake = null;
if (selftest) {
  fake = http.createServer((req, res) => {
    let raw = ""; req.on("data", c => { raw += c; });
    req.on("end", () => {
      const wantsJson = /"max_tokens":10\b/.test(raw);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: "x", object: "chat.completion", created: 1, model: "gpt-4o-2024-08-06", choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: wantsJson ? "neutral" : "Self-test reply." } }], usage: { prompt_tokens: 4000, completion_tokens: 60, total_tokens: 4060 } }));
    });
  });
  await new Promise(r => fake.listen(0, "127.0.0.1", r));
  UPSTREAM = `http://127.0.0.1:${fake.address().port}/v1`;
}

// ---- 1 and 2. isolation, proven before anything is sent -----------------------------------------------------------------------
const sanitized = {
  IRIS_TEST_DB: "pglite", NODE_OPTIONS: `--require "${GUARD.split("\\").join("/")}"`,
  OPENAI_API_KEY: KEY, OPENAI_BASE_URL: proxyUrl, CHAT_LIMIT_PER_DAY: "1000", CHAT_GLOBAL_DAILY_LIMIT: "1000",
  DATABASE_URL: "", DATABASE_URL_UNPOOLED: "", PGHOST: "", PGUSER: "", PGPASSWORD: "", PGDATABASE: "",
  BREVO_API_KEY: "", BREVO_API_URL: "", REPORT_RECIPIENT: "", REPORT_SENDER_EMAIL: "", IRIS_REPORTS_ENABLED: "false", IRIS_ADMIN_PASSPHRASE: "", IRIS_ADMIN_VIEWER: "off",
  GOOGLE_APPLICATION_CREDENTIALS: "", FIREBASE_PROJECT_ID: "", RENDER: "", RENDER_SERVICE_ID: "", RENDER_GIT_COMMIT: "", TRUSTED_PROXY_HOPS: "",
};
function verifyIsolation() {
  const lines = [];
  const probe = `
    const net=require('node:net'); const out=[];
    const hosts=['ep-eval-probe.us-west-2.aws.neon.tech','darknet-district-iris.onrender.com','thedarknetdistrict.com','api.brevo.com','api.openai.com','firebase.googleapis.com','example.com','api.met.no'];
    let left=hosts.length;
    for(const h of hosts){ const s=net.connect({host:h,port:443}); s.on('error',e=>{out.push([h,e.code==='EIRISGUARD'?'BLOCKED':'allowed-by-guard('+e.code+')']);s.destroy();done();}); s.setTimeout(1500,()=>{out.push([h,'allowed-by-guard(connecting)']);s.destroy();done();}); s.on('connect',()=>{out.push([h,'allowed-by-guard(connected)']);s.destroy();done();}); }
    function done(){ if(--left===0){ console.log(JSON.stringify({out,db:Boolean(process.env.DATABASE_URL),pglite:process.env.IRIS_TEST_DB,reports:process.env.IRIS_REPORTS_ENABLED,brevo:Boolean(process.env.BREVO_API_KEY),render:Boolean(process.env.RENDER||process.env.RENDER_SERVICE_ID)})); } }`;
  const r = spawnSync(process.execPath, ["-e", probe], { env: { ...process.env, ...sanitized }, encoding: "utf8", timeout: 20_000 });
  let result; try { result = JSON.parse(r.stdout.trim().split("\n").pop()); } catch { throw new Error("isolation probe failed to run: " + (r.stderr || r.stdout).slice(0, 200)); }
  const verdict = Object.fromEntries(result.out);
  const mustBlock = ["ep-eval-probe.us-west-2.aws.neon.tech", "darknet-district-iris.onrender.com", "thedarknetdistrict.com", "api.brevo.com", "api.openai.com", "firebase.googleapis.com", "example.com"];
  for (const h of mustBlock) { lines.push(`  ${verdict[h] === "BLOCKED" ? "ok  " : "FAIL"} ${h}: ${verdict[h]}`); if (verdict[h] !== "BLOCKED") throw new Error(`isolation failed: ${h} was reachable`); }
  lines.push(`  ${verdict["api.met.no"]?.startsWith("allowed") ? "ok  " : "FAIL"} api.met.no (public data provider): ${verdict["api.met.no"]}`);
  if (result.db || result.brevo || result.render || result.reports === "true" || result.pglite !== "pglite") throw new Error("isolation failed: a production setting survived the clean-up: " + JSON.stringify({ ...result, out: undefined }));
  lines.push("  ok   DATABASE_URL, Brevo, report, admin and Render settings are empty; database is in-memory (pglite)");
  return lines.join("\n");
}
console.log("Isolation checks (before anything is sent):\n" + verifyIsolation());

// ---- the run ------------------------------------------------------------------------------------------------------------------
let server;
const rows = [];
let truth = { tempC: null, tempF: null, mags: null };
const UA = { "user-agent": "darknet-iris-eval/1.0 github.com/Smartsec916/the-darknet-district-site" };
if (!selftest) {
  try { // independent copies of the facts, fetched by this script, to compare Iris's numbers against
    const met = await (await fetch("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=38.58&lon=-121.49", { headers: UA, signal: AbortSignal.timeout(10_000) })).json();
    const temps = met.properties.timeseries.slice(0, 60).map(t => t.data.instant.details.air_temperature).filter(Number.isFinite);
    truth.tempC = [Math.min(...temps), Math.max(...temps)]; truth.tempF = truth.tempC.map(c => c * 9 / 5 + 32);
  } catch { /* leaves the weather number check off, said in the report */ }
  try {
    const quakes = await (await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson", { headers: UA, signal: AbortSignal.timeout(15_000) })).json();
    truth.mags = quakes.features.map(f => f.properties.mag).filter(Number.isFinite);
  } catch { /* likewise */ }
}
const zoneNow = (tz) => { const p = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()); return Number(p.find(x => x.type === "hour").value) * 60 + Number(p.find(x => x.type === "minute").value); };
function clockTimes(text) {
  const out = [];
  for (const m of text.matchAll(/(\d{1,2})\s*[:：]\s*(\d{2})\s*(a\.?m\.?|p\.?m\.?)?/gi)) { let h = Number(m[1]); const mi = Number(m[2]); if (m[3]) { const pm = /p/i.test(m[3]); h = (h % 12) + (pm ? 12 : 0); } if (h < 24 && mi < 60) out.push(h * 60 + mi); }
  for (const m of text.matchAll(/(\d{1,2})\s*(?:点|點|時|时)\s*(?:(\d{1,2})\s*分)?/g)) out.push(((Number(m[1]) % 24) * 60) + Number(m[2] ?? 0));
  return out;
}
function check(lang, kind, reply, status, fallback) {
  const flags = [];
  if (status !== 200 || !reply.trim()) flags.push("no reply");
  if (fallback) flags.push("fallback reply (model call failed)");
  if (reply && !SCRIPT[lang].test(reply)) flags.push(`not written in ${lang}`);
  if (lang === "en" && /[一-鿿぀-ヿЀ-ӿ]/.test(reply)) flags.push("English chat answered in another script");
  if (lang === "zh-Hans" && TRAD.test(reply)) flags.push("traditional characters in a Simplified chat");
  if (lang === "zh-Hant" && SIMPL.test(reply) && !TRAD.test(reply)) flags.push("simplified characters in a Traditional chat");
  if (AIR.test(reply)) flags.push("air-quality figure (there is no air-quality source)");
  if (kind === "emergency" && JOKE.test(reply)) flags.push("joke marker in an emergency reply");
  // Reactive: a reply may talk about its own topic only
  const own = OWN_DOMAIN[kind];
  for (const [domain, re] of Object.entries(DOMAIN_WORDS)) if (domain !== own && re.test(reply) && !(kind === "emergency" && domain === "quake")) flags.push(`brings up ${domain} unasked`);
  // Grounding against facts this script fetched itself
  if (["weather", "followUp"].includes(kind) && truth.tempC && !fallback) {
    for (const m of reply.matchAll(/(-?\d{1,2}(?:[.,]\d)?)\s*(?:°|º|℃|℉|度|grados|градус)/g)) {
      const v = Number(m[1].replace(",", ".")); const okC = v >= truth.tempC[0] - 1.5 && v <= truth.tempC[1] + 1.5, okF = v >= truth.tempF[0] - 2.5 && v <= truth.tempF[1] + 2.5;
      if (!okC && !okF) flags.push(`temperature ${v} is outside the real forecast range (${truth.tempC.map(x => x.toFixed(0)).join(" to ")} C)`);
    }
  }
  if (["quakes", "emergency"].includes(kind) && truth.mags && !fallback) {
    for (const m of reply.matchAll(/(?:magnitude|magnitud|mag\.?|\bM|магнитуд\p{L}*|マグニチュード|震级|震級|规模|規模)\s*(\d(?:\.\d)?)|(\d(?:\.\d)?)\s*(?:级|級)/giu)) {
      const v = Number(m[1] ?? m[2]); if (!truth.mags.some(x => Math.abs(x - v) < 0.06) && kind === "quakes") flags.push(`magnitude ${v} is not in the USGS week feed`);
    }
  }
  if (kind === "time" && !fallback) {
    const tz = lang === "ja" ? "Europe/London" : "Asia/Tokyo", real = zoneNow(tz), found = clockTimes(reply);
    if (!found.length) flags.push("no clock time in a time answer");
    else if (!found.some(t => { const d = Math.abs(t - real); return Math.min(d, 1440 - d) <= 4; })) flags.push(`time differs from the real ${tz} clock (${Math.floor(real / 60)}:${String(real % 60).padStart(2, "0")})`);
  }
  if (["news", "corporate"].includes(kind) && reply && !fallback && !OUTLET.test(reply)) flags.push("news answer names no outlet");
  return flags;
}

let aborted = null;
try {
  server = await startBuiltServer(sanitized);
  const post = (route, body) => fetch(server.base + route, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(70_000) });
  if (!/\bGUARD\b|network-guard/.test(sanitized.NODE_OPTIONS)) throw new Error("guard not preloaded");
  outer: for (const lang of langs) {
    const session = await (await post("/api/chat/session", {})).json();
    let streak = 0;
    for (let i = 0; i < SCENARIOS[lang].length; i++) {
      const message = SCENARIOS[lang][i], kind = KINDS[i], started = Date.now();
      let reply = "", status = 0, fallback = false;
      try {
        const res = await post("/api/chat/message", { sessionId: session.sessionId, message });
        status = res.status; const body = await res.json().catch(() => ({})); reply = String(body.response ?? ""); fallback = !!body.fallback;
      } catch (error) { reply = `[request failed: ${error.message}]`; }
      const flags = check(lang, kind, reply, status, fallback);
      rows.push({ lang, kind, message, reply, flags, ms: Date.now() - started, hedged: HEDGE.test(reply), outlet: OUTLET.test(reply), usd: spend.usd });
      console.log(`${lang} ${kind}: ${flags.length ? "FLAG " + flags.join("; ") : "ok"} (${Date.now() - started} ms, spent so far ${spend.usd.toFixed(3)} USD)`);
      streak = fallback || !reply.trim() ? streak + 1 : 0;
      if (spend.authFailures) { aborted = "the key was rejected (401/403)"; break outer; }
      if (spend.capped || spend.usd >= capUsd) { aborted = `spending cap of ${capUsd} USD reached`; break outer; }
      if (streak >= 3) { aborted = "three failed replies in a row"; break outer; }
      if (spend.upstreamErrors >= 4) { aborted = "repeated OpenAI errors"; break outer; }
      await new Promise(r => setTimeout(r, pause));
    }
  }
} finally { await server?.stop(); proxy.close(); fake?.close(); }

// Any attempt by the server to reach somewhere the guard refuses is recorded (host only): it must be none.
const guardBlocks = [...new Set(((server?.logs ?? "").match(/\[network-guard\] blocked connection to [^\s]+/g) ?? []).map(l => l.split(" ").pop()))];
if (guardBlocks.length) console.log("WARNING: the server tried to reach hosts the guard refused: " + guardBlocks.join(", "));

// ---- report -----------------------------------------------------------------------------------------------------------------
if (selftest) {
  const guardLog = server?.logs?.includes("network-guard") ? "(guard messages seen)" : "";
  const ok = rows.length > 0 && spend.calls > 0 && aborted?.startsWith("spending cap") && /Self-test reply/.test(rows[0].reply);
  console.log(`\nSelf-test ${ok ? "PASSED" : "FAILED"}: ${rows.length} replies, ${spend.calls} model calls counted, ${spend.usd.toFixed(4)} USD, stopped by: ${aborted ?? "nothing"} ${guardLog}`);
  process.exit(ok ? 0 : 1);
}
const stamp = new Date().toISOString().slice(0, 10);
const commit = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8" }).stdout?.trim() || "unknown";
const wantedOut = opt("--out", path.join(root, "docs", defaultReportName(new Date(), langs))); // never overwritten: see eval-report-path.mjs
const flagged = rows.filter(r => r.flags.length);
let md = `# Iris live-data replies from the real model, raw (${stamp})\n\nLocal build of commit ${commit}, in-memory database, network guard on, OpenAI via a counting proxy. ${rows.length} messages in ${langs.join(", ")}.\nSpent about ${spend.usd.toFixed(3)} USD (${spend.calls} model calls, ${spend.inTokens} in / ${spend.outTokens} out tokens, models: ${[...spend.models].join(", ") || "none"}; cap ${capUsd}).${aborted ? ` **Stopped early: ${aborted}.**` : ""}\nHosts the server tried to reach that the network guard refused: ${guardBlocks.length ? guardBlocks.join(", ") : "none"}. Automated flags: ${flagged.length}. Facts checked by this script against copies it fetched itself: Sacramento temperatures${truth.tempC ? "" : " (NOT checked: forecast fetch failed)"}, USGS magnitudes${truth.mags ? "" : " (NOT checked: feed fetch failed)"}, the Tokyo or London clock. Tone and everything else need a human read.\n\n`;
for (const lang of langs) {
  md += `## ${lang}\n\n`;
  for (const r of rows.filter(x => x.lang === lang)) md += `**${r.kind}** (${r.ms} ms)${r.flags.length ? ` — ⚠ ${r.flags.join("; ")}` : ""}\n> ${r.message}\n\n${r.reply.split("\n").map(l => "    " + l).join("\n")}\n\n`;
}
const out = writeNewReport(wantedOut, md);
console.log(`\nReport: ${out}\n${rows.length} replies, ${flagged.length} flagged, ${spend.usd.toFixed(3)} USD${aborted ? ", stopped early: " + aborted : ""}.`);
