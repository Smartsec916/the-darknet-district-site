// A new evaluation report must never replace an old one (the transcripts are evidence of what the real model said).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defaultReportName, writeNewReport } from "../scripts/eval-report-path.mjs";

test("report names carry the time and the languages, so two runs on one day differ", () => {
  const a = defaultReportName(new Date("2026-11-02T01:02:03Z"), ["en"]);
  const b = defaultReportName(new Date("2026-11-02T05:06:07Z"), ["zh", "ja"]);
  assert.equal(a, "IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T01-02-03Z-en.md");
  assert.equal(b, "IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02T05-06-07Z-zh+ja.md");
  assert.notEqual(a, b);
});

test("an existing report is never overwritten, even when the same name is asked for again or by --out", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "iris-eval-"));
  try {
    const wanted = path.join(dir, "nested", "report.md");
    const first = writeNewReport(wanted, "first");
    const second = writeNewReport(wanted, "second");
    const third = writeNewReport(wanted, "third");
    assert.equal(first, wanted);
    assert.deepEqual([second, third].map(p => path.basename(p)), ["report-2.md", "report-3.md"]);
    assert.deepEqual([first, second, third].map(p => fs.readFileSync(p, "utf8")), ["first", "second", "third"], "every earlier report is intact");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
