// Checks, from the outside and read-only, that the Iris service gives each visitor their own
// rate-limit bucket and cannot be fooled by a forged X-Forwarded-For header.
//
//   node scripts/verify-client-ip.mjs https://darknet-district-iris.onrender.com
//
// It sends a handful of GET requests to a path that does not exist (the general limiter counts
// them, nothing else happens: no chat, no OpenAI, no database). The general limiter allows 60
// requests a minute per visitor and reports what is left in a RateLimit-Remaining header. For one
// visitor that number must drop by exactly one per request, whatever X-Forwarded-For says:
//
//   PASS  steady countdown      your bucket is yours alone and a forged header does not reset it
//   WARN  drops by more than 1  other visitors are counted in the same bucket
//   FAIL  goes back up          the service sees different "visitors" for you (the bug), or a
//                               forged header gave you a fresh bucket (spoofable)
import { pathToFileURL } from "node:url";

export function judge(values) {
  if (!values.length || values.some(v => !Number.isFinite(v))) {
    return { verdict: "FAIL", reason: "the service did not report a RateLimit-Remaining header" };
  }
  let shared = false;
  for (let i = 1; i < values.length; i++) {
    const step = values[i - 1] - values[i];
    if (step < 0 || (step === 0)) {
      return { verdict: "FAIL", reason: `the counter did not go down at request ${i + 1} (${values[i - 1]} then ${values[i]}): requests from one machine landed in different buckets` };
    }
    if (step > 1) shared = true;
  }
  return shared
    ? { verdict: "WARN", reason: "the counter dropped by more than one per request: other visitors share this bucket" }
    : { verdict: "PASS", reason: "a steady countdown: one bucket per visitor, and forged headers did not change it" };
}

async function remaining(base, headers) {
  const response = await fetch(`${base}/api/verify-client-ip`, { headers, cache: "no-store" });
  await response.arrayBuffer();
  return Number(response.headers.get("ratelimit-remaining"));
}

export async function run(base) {
  // Plain, then forged headers of every shape a visitor could try, then plain again
  const steps = [
    ["plain", {}],
    ["plain", {}],
    ["forged single address", { "X-Forwarded-For": "198.51.100.1" }],
    ["forged single address (another)", { "X-Forwarded-For": "198.51.100.2" }],
    ["forged chain", { "X-Forwarded-For": "203.0.113.9, 198.51.100.3" }],
    ["forged private address", { "X-Forwarded-For": "10.1.2.3" }],
    ["forged Cloudflare address", { "X-Forwarded-For": "173.245.48.1" }],
    ["plain", {}],
    ["plain", {}],
  ];
  const values = [];
  for (const [label, headers] of steps) {
    const value = await remaining(base, headers);
    values.push(value);
    console.log(`  ${label.padEnd(34)} remaining: ${value}`);
  }
  return { values, ...judge(values) };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const base = (process.argv[2] || "").replace(/\/$/, "");
  if (!/^https?:\/\//.test(base)) {
    console.error("usage: node scripts/verify-client-ip.mjs https://your-service.onrender.com");
    process.exit(2);
  }
  // A one-minute rate-limit window can roll over mid-test; a real problem repeats every time
  let result;
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`\nattempt ${attempt} against ${base}`);
    result = await run(base);
    console.log(`  => ${result.verdict}: ${result.reason}`);
    if (result.verdict !== "FAIL") break;
  }
  console.log(`\nRESULT: ${result.verdict}`);
  process.exit(result.verdict === "FAIL" ? 1 : 0);
}
