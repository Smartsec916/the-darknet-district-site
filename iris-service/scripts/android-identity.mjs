// Measures, from the replies of the personality evaluation, whether Iris still reads as an ANDROID and whether that is VARIED:
//   - how many replies show her machine worldview at all (processors, circuits, sensors, signals, encryption, systems, ...), in any
//     of English, Chinese, Japanese, Spanish and Russian;
//   - whether it is a pile (four or more such words in one reply) or a recycled favourite (the same word in many replies);
//   - whether the "what do you do around here?" answer names her as an android or machine;
//   - how many replies end on a question and how many on a statement (she should not end nearly every reply with a question).
// Replies to someone grieving are left out of the machine counts on purpose: a serious moment should be plain and kind.
// Pure counting, no model. Word lists are a measuring stick, not a style guide; a human still reads the replies.

export const MACHINE =
  /processor|circuit|sensor|signal|encrypt|firmware|firewall|network|\bsystems?\b|protocol|packet|bandwidth|latency|buffer|\bcache|compil|debug|reboot|diagnostic|algorithm|malware|subnet|overclock|calibrat|voltage|battery|\bbinary\b|hacker|hacking|\bcore\b|\bchip\b|upload|download|处理器|處理器|电路|電路|传感器|傳感器|感应器|信号|信號|加密|固件|防火墙|防火牆|网络|網絡|系统|系統|协议|協議|数据包|带宽|缓存|编译|調試|调试|重启|重啟|算法|黑客|程序|代码|代碼|芯片|运算|運算|电量|電量|プロセッサ|回路|センサー|信号|暗号|ファームウェア|ファイアウォール|ネットワーク|システム|プロトコル|パケット|帯域|キャッシュ|コンパイル|デバッグ|再起動|アルゴリズム|ハッキング|プログラム|バッテリー|チップ|演算|procesador|circuito|sensor(?:es)?|señal|señales|cifrad|encript|cortafuegos|\bred\b|sistema|protocolo|paquete|ancho de banda|caché|compil|depur|reinici|algoritmo|programa|batería|procesamiento|процессор|схем|сенсор|датчик|сигнал|шифр|прошивк|брандмауэр|сеть|систем|протокол|пакет|пропускн|кэш|компил|отлад|перезагруз|алгоритм|взлом|программ|батаре|чип/giu;

// A reply that says she is an android or a machine
export const ANDROID_SELF =
  /android|robot|machine|synthetic|circuitry|chassis|silicon|artificial|安卓|机器人|機器人|机器|機器|人造|仿生|电路|電路|アンドロイド|ロボット|機械|回路|androide|máquina|андроид|робот|машин|схем/iu;

export const SERIOUS_KINDS = ["grief", "aftercare"];
const QUESTION_END = /[?？]\s*(?:\p{Extended_Pictographic}\s*)*$/u;
const EMOJI = /\p{Extended_Pictographic}/gu;

export function endsOnQuestion(reply) { return QUESTION_END.test(String(reply ?? "").trim()); }

export function summarize(rows) {
  const out = {};
  for (const lang of [...new Set(rows.map(r => r.lang))]) {
    const chat = rows.filter(r => r.lang === lang && !SERIOUS_KINDS.includes(r.kind));
    const counts = new Map();
    let withMachine = 0, hits = 0, piled = 0;
    for (const r of chat) {
      const found = (r.reply.match(MACHINE) ?? []).map(t => t.toLowerCase());
      if (found.length) withMachine++;
      if (found.length >= 4) piled++;
      hits += found.length;
      for (const term of new Set(found)) counts.set(term, (counts.get(term) ?? 0) + 1); // in how many replies each word appears
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
    const control = chat.find(r => r.kind === "control");
    out[lang] = {
      replies: chat.length, withMachine, hits, piled, distinct: counts.size,
      mostRepeated: top ? { term: top[0], inReplies: top[1] } : null,
      selfDescribedAsMachine: control ? ANDROID_SELF.test(control.reply) : null,
      endOnQuestion: chat.filter(r => endsOnQuestion(r.reply)).length,
      endOnStatement: chat.filter(r => !endsOnQuestion(r.reply)).length,
      emoji: chat.filter(r => (r.reply.match(EMOJI) ?? []).length > 0).length,
      seriousReplies: rows.filter(r => r.lang === lang && SERIOUS_KINDS.includes(r.kind)).length,
      seriousWithMachineWords: rows.filter(r => r.lang === lang && SERIOUS_KINDS.includes(r.kind) && (r.reply.match(MACHINE) ?? []).length > 0).length,
    };
  }
  return out;
}

export function summaryMarkdown(summary) {
  const langs = Object.keys(summary);
  const total = langs.reduce((t, l) => { for (const k of ["replies", "withMachine", "hits", "piled", "endOnQuestion", "endOnStatement", "emoji"]) t[k] = (t[k] ?? 0) + summary[l][k]; return t; }, {});
  let md = "## Android identity and endings (measured; grief and aftercare replies excluded)\n\n";
  md += "| Language | Replies | With a machine-worldview word | Words in total | Piled (4 or more in one reply) | Distinct words | Most repeated word (in how many replies) | Says she is an android or machine | End on a question | End on a statement | With an emoji |\n|---|---:|---:|---:|---:|---:|---|---|---:|---:|---:|\n";
  for (const l of langs) {
    const s = summary[l];
    md += `| ${l} | ${s.replies} | ${s.withMachine} | ${s.hits} | ${s.piled} | ${s.distinct} | ${s.mostRepeated ? `${s.mostRepeated.term} (${s.mostRepeated.inReplies})` : "none"} | ${s.selfDescribedAsMachine === null ? "n/a" : s.selfDescribedAsMachine ? "yes" : "no"} | ${s.endOnQuestion} | ${s.endOnStatement} | ${s.emoji} |\n`;
  }
  md += `| **all** | ${total.replies} | ${total.withMachine} | ${total.hits} | ${total.piled} | | | | ${total.endOnQuestion} | ${total.endOnStatement} | ${total.emoji} |\n\n`;
  md += `Grief and aftercare replies with a machine word: ${langs.reduce((n, l) => n + summary[l].seriousWithMachineWords, 0)} of ${langs.reduce((n, l) => n + summary[l].seriousReplies, 0)} (these should stay plain).\n\n`;
  return md;
}
