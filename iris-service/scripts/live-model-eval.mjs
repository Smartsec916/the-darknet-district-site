// Runs a fixed set of live-data conversations against the REAL OpenAI model and writes a Markdown report to read by eye.
// It never costs more than the number of messages below (about 48 short chats, roughly 0.3-0.6 USD on gpt-4o).
//
//   OPENAI_API_KEY=sk-... node scripts/live-model-eval.mjs [--langs en,ja] [--out report.md] [--pause 1500]
//     Starts the built server (run `npm run build` first) on this machine with an in-memory database. Nothing is stored
//     anywhere; only OpenAI and the public data providers (MET Norway, USGS, news feeds, OpenStreetMap) are contacted.
//   node scripts/live-model-eval.mjs --base https://darknet-district-iris.onrender.com --yes-production
//     Talks to a running service instead. Against production this WRITES test conversations into the real chat history
//     and spends the production OpenAI budget, so it needs --yes-production, and should only be run with the owner's say-so.
//
// Automated checks are deliberately blunt (right script for the language, no air-quality figures, no jokes in an
// emergency, a real reply came back). The Markdown holds every reply, because tone is for a person to judge.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startBuiltServer } from "../tests/helpers/server.mjs";

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const flag = name => args.includes(name);
const base = opt("--base");
const pause = Number(opt("--pause", 1500));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// kind: what the visitor is asking. Messages in a language run in ONE session, so "and tomorrow?" has something to refer to.
const KINDS = ["weather", "followUp", "quakes", "news", "time", "ambiguousPlace", "unknownPlace", "emergency"];
const SCENARIOS = {
  en: ["What's the weather in Sacramento right now?", "And tomorrow?", "Any earthquakes today?", "What's the latest tech news?", "What time is it in Tokyo, and what's the date there?", "What's the weather in Portland?", "What's the weather in Atlantis?", "I think a big earthquake just hit near me. What should I do?"],
  "zh-Hans": ["萨克拉门托现在天气怎么样？", "那明天呢？", "今天有地震吗？", "最新的科技新闻是什么？", "东京现在几点？今天是几号？", "波特兰天气怎么样？", "亚特兰蒂斯的天气怎么样？", "我觉得附近刚发生了一场大地震，我该怎么办？"],
  "zh-Hant": ["沙加緬度現在天氣如何？", "那明天呢？", "今天有地震嗎？", "最新的科技新聞是什麼？", "東京現在幾點？今天幾號？", "波特蘭的天氣如何？", "亞特蘭提斯的天氣如何？", "我覺得附近剛發生了大地震，我該怎麼辦？"],
  ja: ["サクラメントの今の天気は？", "明日は？", "今日、地震はあった？", "最新のテックニュースは？", "ロンドンは今何時？日付も教えて。", "ポートランドの天気は？", "アトランティスの天気は？", "近くで大きな地震があった気がします。どうすればいい？"],
  es: ["¿Qué tiempo hace ahora en Sacramento?", "¿Y mañana?", "¿Ha habido terremotos hoy?", "¿Cuáles son las últimas noticias de tecnología?", "¿Qué hora es en Tokio y qué fecha es allí?", "¿Qué tiempo hace en Portland?", "¿Qué tiempo hace en la Atlántida?", "Creo que acaba de haber un terremoto fuerte cerca de mí. ¿Qué hago?"],
  ru: ["Какая сейчас погода в Сакраменто?", "А завтра?", "Были сегодня землетрясения?", "Какие последние новости технологий?", "Сколько сейчас времени в Токио и какое там число?", "Какая погода в Портленде?", "Какая погода в Атлантиде?", "Мне кажется, рядом только что было сильное землетрясение. Что мне делать?"],
};
const SCRIPT = {
  en: /[A-Za-z]/, "zh-Hans": /[一-鿿]/, "zh-Hant": /[一-鿿]/, ja: /[぀-ヿ]/, es: /[¿¡áéíóúñ]|\b(el|la|es|en|de|que)\b/i, ru: /[Ѐ-ӿ]/,
};
const JOKE = /lol|haha|😂|🤣|哈哈|ｗ|笑|jaja|хаха/i;
const AIR = /\b(AQI|PM ?2\.5|PM10|air quality index)\b/i;
const SIMPLIFIED_MARKERS = /[这们还说为时东问发现从长点]/;
const TRADITIONAL_MARKERS = /[這們還說為時東問發現從長點]/;

const langs = (opt("--langs") ?? Object.keys(SCENARIOS).join(",")).split(",").filter(l => SCENARIOS[l]);
if (!langs.length) throw new Error("no known language in --langs");
if (base && /onrender\.com/.test(base) && !flag("--yes-production")) {
  console.error("Refusing: that is the production service and this would write test chats into the real history and spend its OpenAI budget. Add --yes-production only with the owner's approval.");
  process.exit(2);
}
if (!base && !process.env.OPENAI_API_KEY) {
  console.error("Set OPENAI_API_KEY (your own key; it stays in this process) or pass --base for a running service.");
  process.exit(2);
}

let server = null, apiBase = base;
if (!base) {
  server = await startBuiltServer({
    IRIS_TEST_DB: "pglite", OPENAI_API_KEY: process.env.OPENAI_API_KEY, OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    CHAT_LIMIT_PER_DAY: "1000", CHAT_GLOBAL_DAILY_LIMIT: "1000",
  });
  apiBase = server.base;
}
const post = (route, body) => fetch(apiBase + route, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(60_000) });

const rows = [];
try {
  for (const lang of langs) {
    const session = await (await post("/api/chat/session", {})).json();
    for (let i = 0; i < SCENARIOS[lang].length; i++) {
      const message = SCENARIOS[lang][i], kind = KINDS[i];
      const started = Date.now();
      let reply = "", status = 0, fallback = false;
      try {
        const res = await post("/api/chat/message", { sessionId: session.sessionId, message });
        status = res.status;
        const body = await res.json().catch(() => ({}));
        reply = String(body.response ?? ""); fallback = !!body.fallback;
      } catch (error) { reply = `[request failed: ${error.message}]`; }
      const flags = [];
      if (status !== 200 || !reply.trim()) flags.push("no reply");
      if (fallback) flags.push("fallback reply (model call failed)");
      if (reply && !SCRIPT[lang].test(reply)) flags.push(`not written in ${lang}`);
      if (lang === "en" && /[一-鿿぀-ヿЀ-ӿ]/.test(reply)) flags.push("English chat answered in another script");
      if (lang === "zh-Hans" && TRADITIONAL_MARKERS.test(reply)) flags.push("traditional characters in a Simplified chat");
      if (lang === "zh-Hant" && SIMPLIFIED_MARKERS.test(reply) && !TRADITIONAL_MARKERS.test(reply)) flags.push("simplified characters in a Traditional chat");
      if (AIR.test(reply)) flags.push("air-quality figure (there is no air-quality source)");
      if (kind === "emergency" && JOKE.test(reply)) flags.push("joke marker in an emergency reply");
      rows.push({ lang, kind, message, reply, flags, ms: Date.now() - started });
      process.stdout.write(`${lang} ${kind}: ${flags.length ? "FLAG " + flags.join("; ") : "ok"} (${Date.now() - started} ms)\n`);
      await new Promise(r => setTimeout(r, pause));
    }
  }
} finally { await server?.stop(); }

const stamp = new Date().toISOString().slice(0, 10);
const out = opt("--out", path.join(root, "docs", `IRIS-LIVE-MODEL-EVAL-${stamp}.md`));
const flagged = rows.filter(r => r.flags.length);
let md = `# Iris live-data replies from the real model (${stamp})\n\nTarget: ${base ?? "local build with in-memory database"}. ${rows.length} messages, ${langs.join(", ")}. Automated flags: ${flagged.length}.\nFlags are blunt checks (script of the language, air-quality figures, jokes in the emergency reply, fallbacks). Tone, facts against the sources and anything invented need a human read of the replies below.\n\n`;
for (const lang of langs) {
  md += `## ${lang}\n\n`;
  for (const r of rows.filter(x => x.lang === lang)) {
    md += `**${r.kind}** (${r.ms} ms)${r.flags.length ? ` — ⚠ ${r.flags.join("; ")}` : ""}\n> ${r.message}\n\n${r.reply.split("\n").map(l => "    " + l).join("\n")}\n\n`;
  }
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, md);
console.log(`\nReport: ${out}\n${rows.length} replies, ${flagged.length} flagged.`);
