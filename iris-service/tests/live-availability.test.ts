// Truthful wording about the live-data service (docs/IRIS-LIVE-MODEL-EVAL-RAW-2026-11-02-POSTDEPLOY-en.md): asking "weather in
// Portland" got "the data streams are a bit clogged" and then a clarifying question. A name that matches several places, no
// place at all, or an unknown place is not an outage; only a lookup or provider that really failed may be described as one.
// No network, no model.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { net } from "../server/live/http";
import { resetGeocodeForTests, setGeocodeGapForTests } from "../server/live/geocode";
import { resetWeatherForTests } from "../server/live/weather";
import { resetQuakesForTests } from "../server/live/quakes";
import { resetNewsForTests } from "../server/live/news";
import { OUTAGE_CLAIM, prepareLive, resetLiveForTests } from "../server/live";

const fixture = (name: string) => fs.readFileSync(new URL(`./fixtures/live/${name}`, import.meta.url), "utf8");
const NOW = Date.parse("2026-11-01T18:00:00Z");
const ok = (body: string) => new Response(body, { status: 200, headers: { "content-type": "application/json" } });
const realFetch = net.fetch;

// Two Springfields, so a second ambiguous name is covered without a captured fixture of the real service
const springfield = JSON.stringify([
  { name: "Springfield", lat: "39.80", lon: "-89.64", addresstype: "city", importance: 0.65, address: { state: "Illinois", country: "United States", country_code: "us" } },
  { name: "Springfield", lat: "37.21", lon: "-93.29", addresstype: "city", importance: 0.64, address: { state: "Missouri", country: "United States", country_code: "us" } },
]);
function network(mode: "normal" | "geocoder-down" | "weather-down") {
  net.fetch = async (url: string) => {
    const u = new URL(url);
    if (u.hostname === "nominatim.openstreetmap.org") {
      if (mode === "geocoder-down") return new Response("down", { status: 503 });
      const q = (u.searchParams.get("q") ?? "").split(",")[0].trim();
      if (q === "Springfield") return ok(springfield);
      const file = new URL(`./fixtures/live/nominatim-${q}.json`, import.meta.url);
      return fs.existsSync(file) ? ok(fs.readFileSync(file, "utf8")) : ok("[]");
    }
    if (u.hostname === "api.met.no") return mode === "weather-down" ? new Response("down", { status: 503 }) : ok(fixture("met-sacramento.json"));
    if (u.hostname === "api.weather.gov") return ok(JSON.stringify({ features: [] }));
    return new Response("not found", { status: 404 });
  };
}
beforeEach(() => {
  net.fetch = realFetch;
  resetGeocodeForTests(); resetWeatherForTests(); resetQuakesForTests(); resetNewsForTests(); resetLiveForTests(); setGeocodeGapForTests(0);
});
test.after(() => { net.fetch = realFetch; });

const REAL_BAD_REPLY = "Seems like the data streams are a bit clogged up at the moment, and I can't retrieve Portland's current weather. Let me know if you'd like me to give it another shot, though! Just a quick question, which Portland are you curious about—Oregon or Maine?";

test("an ambiguous name (Portland, Springfield) is not described as an outage, in the instruction or in the reply", async () => {
  network("normal");
  for (const [message, name, options] of [["What's the weather in Portland?", "Portland", /Oregon[^;]*; Portland, Maine|Portland, Oregon/], ["weather in Springfield", "Springfield", /Illinois[\s\S]*Missouri/]] as const) {
    const prep = (await prepareLive({ message, sessionId: name, nowMs: NOW }))!;
    assert.equal(prep.outcome, "ambiguous_place", name);
    assert.match(prep.prompt, options, "the options are given to her");
    assert.doesNotMatch(prep.tail, /could NOT retrieve|(?<!not )offer to try again/i, "the instruction does not tell her a lookup failed");
    assert.match(prep.tail, /Nothing is broken/); assert.match(prep.tail, /which of the listed places/);
    // the exact reply the real model gave is replaced by a plain, true question that names the options
    const fixed = prep.check(REAL_BAD_REPLY);
    assert.equal(fixed.replaced, true, "the false outage claim is not shown");
    assert.match(fixed.text, new RegExp(`^Which ${name} do you mean: `)); assert.doesNotMatch(fixed.text, /clogged|retrieve|stream/i);
    // a good reply is left alone, and so is one that mentions "can't" without claiming a failure
    for (const good of [`Which ${name} do you mean, runner?`, `I can't pick a forecast until you tell me which ${name} you mean: Oregon or Maine?`, "¿Cuál Portland, el de Oregón o el de Maine?"]) {
      assert.deepEqual(prep.check(good), { text: good, replaced: false }, good);
    }
  }
});

test("no place named and an unknown place are not outages either", async () => {
  network("normal");
  const none = (await prepareLive({ message: "what's the weather like outside?", sessionId: "n", nowMs: NOW }))!;
  assert.equal(none.outcome, "needs_place");
  assert.doesNotMatch(none.tail, /could NOT retrieve/); assert.match(none.tail, /Nothing is broken/); assert.match(none.tail, /do not know which place/);
  const bad = none.check("My data feeds are down, I cannot fetch anything right now. Which city?");
  assert.deepEqual(bad, { text: "Which city or region do you mean?", replaced: true });
  assert.equal(none.check("Which city are you in, runner?").replaced, false);

  const unknown = (await prepareLive({ message: "weather in Qwertyland", sessionId: "u", nowMs: NOW }))!;
  assert.equal(unknown.outcome, "unknown_place");
  assert.doesNotMatch(unknown.tail, /could NOT retrieve|(?<!not )offer to try again/i); assert.match(unknown.tail, /found no such place/);
});

test("a lookup or provider that really failed is still reported as a failure", async () => {
  network("geocoder-down");
  const lookup = (await prepareLive({ message: "weather in Sacramento", sessionId: "d1", nowMs: NOW }))!;
  assert.equal(lookup.outcome, "unavailable");
  assert.match(lookup.tail, /could NOT retrieve/); assert.match(lookup.tail, /offer to try again/);
  assert.deepEqual(lookup.check("The place lookup is not answering right now. Want me to try again?"), { text: "The place lookup is not answering right now. Want me to try again?", replaced: false }, "an honest outage reply is never rewritten");

  resetGeocodeForTests(); resetWeatherForTests(); resetLiveForTests();
  network("weather-down");
  const provider = (await prepareLive({ message: "weather in Sacramento", sessionId: "d2", nowMs: NOW }))!;
  assert.equal(provider.outcome, "unavailable");
  assert.match(provider.tail, /could NOT retrieve/);
});

test("the outage-claim pattern catches the real wording and not ordinary replies", () => {
  for (const claim of [REAL_BAD_REPLY, "The data feeds are down.", "I couldn't reach the weather service.", "Technical difficulties, try later.", "Satellite signal is glitchy."]) assert.match(claim, OUTAGE_CLAIM, claim);
  for (const fine of ["Which Portland do you mean, Oregon or Maine?", "Portland, Oregon or Portland, Maine?", "I can't guess which Portland you mean.", "No such place on any map I know.", "Which city, runner?"]) assert.doesNotMatch(fine, OUTAGE_CLAIM, fine);
});
