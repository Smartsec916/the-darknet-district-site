// Where an evaluation report goes, and the guarantee that a new report never replaces an old one. Evaluation transcripts are
// evidence (what the real model said, at what version), so every run gets its own file and an existing file is never opened for
// writing: the file is created with the "wx" flag, which fails if the path exists, and a counter is added until one is free.
import fs from "node:fs";
import path from "node:path";

// IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T01-02-03Z-en.md
export function defaultReportName(now = new Date(), langs = []) {
  const stamp = now.toISOString().slice(0, 19).replace(/:/g, "-") + "Z";
  const tag = langs.length ? "-" + langs.join("+") : "";
  return `IRIS-LIVE-MODEL-EVAL-RAW-${stamp}${tag}.md`;
}

// Writes `content` to `wanted`, or to `wanted` with -2, -3, ... before the extension if that name is taken. Returns the path used.
export function writeNewReport(wanted, content) {
  fs.mkdirSync(path.dirname(wanted), { recursive: true });
  const { dir, name, ext } = path.parse(wanted);
  for (let n = 1; n < 1000; n++) {
    const candidate = n === 1 ? wanted : path.join(dir, `${name}-${n}${ext}`);
    try {
      fs.writeFileSync(candidate, content, { flag: "wx" });
      return candidate;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }
  }
  throw new Error(`no free report name near ${wanted}`);
}
