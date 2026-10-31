// Behavior of the ChatDot widget script (client/public/embedded.html): which backend it
// uses, the message counter, retries, session handling and failure messages. The script
// runs in a small fake browser with a scripted fetch and a virtual clock, so no network
// and no waiting.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "client/public/embedded.html"), "utf8");
const script = html.slice(html.indexOf("<script>") + 8, html.indexOf("</script>"));

// responses: { "/api/chat/message": [ {status, body} | "reject" | "abort" | "hang", ... ] }
function widget(responses = {}) {
  const calls = [];
  const queues = Object.fromEntries(Object.entries(responses).map(([k, v]) => [k, [...v]]));
  const timers = [];
  let clock = 0;
  const listeners = new Map();
  const el = (extra = {}) => ({
    style: {}, children: [], value: "", scrollTop: 0, scrollHeight: 0, className: "", textContent: "",
    addEventListener(type, fn) { listeners.set(this, { ...(listeners.get(this) || {}), [type]: fn }); },
    appendChild(child) { this.children.push(child); },
    focus() {}, ...extra,
  });
  const button = el(), container = el(), close = el(), input = el(), send = el(), messages = el(), typing = el();
  container.style.display = ""; // as on the real page: hidden by CSS, no inline style yet
  const byId = { "iris-chat-button": button, "iris-chat-container": container };
  const bySelector = {
    ".close-chat": close, ".chat-input input": input, ".chat-input button": send,
    ".chat-messages": messages, ".typing-indicator": typing,
  };
  const document = {
    getElementById: id => byId[id],
    querySelector: sel => bySelector[sel],
    createElement: () => el(),
    addEventListener: (type, fn) => { if (type === "DOMContentLoaded") fn(); },
  };
  const fetch = async (url, options = {}) => {
    const u = new URL(url);
    calls.push({ origin: u.origin, path: u.pathname, body: options.body ? JSON.parse(options.body) : null, mode: options.mode });
    const next = (queues[u.pathname] || []).shift();
    if (next === "reject") throw Object.assign(new TypeError("Failed to fetch"), { name: "TypeError" });
    if (next === "abort") throw Object.assign(new Error("aborted"), { name: "AbortError" });
    if (next === "hang") return new Promise(() => {});
    if (next && next.delay) await new Promise(resolve => context.setTimeout(resolve, next.delay));
    const { status = 200, body = {} } = next || {};
    return { status, ok: status >= 200 && status < 300, json: async () => body };
  };
  const context = {
    window: {}, document, fetch, console: { error() {}, log() {} },
    AbortController, URL, JSON, Date: class extends Date { static now() { return clock; } }, Math,
    setTimeout: (fn, ms) => { const t = { fn, at: clock + ms }; timers.push(t); return t; },
    clearTimeout: t => { const i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); },
  };
  context.window.fetch = fetch;
  vm.runInNewContext(script, context);

  const flush = () => new Promise(resolve => setImmediate(resolve));
  // Run due timers in order, letting promises settle between them
  async function settle(maxMs = 300000) {
    await flush();
    while (timers.length) {
      timers.sort((a, b) => a.at - b.at);
      if (timers[0].at > clock + maxMs) break;
      const t = timers.shift();
      clock = Math.max(clock, t.at);
      t.fn();
      await flush();
    }
    await flush();
  }
  return {
    calls, messages, typing, container,
    open: () => listeners.get(button).click(),
    close: () => listeners.get(close).click(),
    async say(text) { input.value = text; listeners.get(send).click(); await settle(); },
    text: () => messages.children.map(c => `${c.className}: ${c.children[0]?.textContent}`),
    last: () => messages.children.at(-1)?.children[0]?.textContent,
    posts: (p) => calls.filter(c => c.path === p && c.body),
  };
}

const IRIS = "https://darknet-district-iris.onrender.com";
const ok = body => ({ status: 200, body });

test("the widget talks to the Render Iris service and nothing else", () => {
  assert.ok(!/replit/i.test(html), "no Replit address may remain");
  const hosts = new Set([...html.matchAll(/https?:\/\/[a-z0-9.-]+/gi)].map(m => new URL(m[0]).host));
  assert.deepEqual([...hosts].filter(h => !h.endsWith("w3.org")), ["darknet-district-iris.onrender.com"]);
});

test("opening the chat wakes the service and starts a session", async () => {
  const w = widget({ "/api/chat/session": [ok({ sessionId: "srv-1" })] });
  w.open();
  await w.say("hello");
  assert.deepEqual(w.calls.slice(0, 2).map(c => c.path), ["/api/health", "/api/chat/session"]);
  assert.equal(w.calls[0].mode, "no-cors");
  assert.ok(w.calls.every(c => c.origin === IRIS));
});

test("messages carry the session id and a counter that goes up by one", async () => {
  const w = widget({
    "/api/chat/session": [ok({ sessionId: "srv-1" })],
    "/api/chat/message": [ok({ response: "one" }), ok({ response: "two" }), ok({ response: "three" })],
  });
  w.open();
  await w.say("a"); await w.say("b"); await w.say("c");
  const posts = w.posts("/api/chat/message");
  assert.deepEqual(posts.map(p => p.body.messageCount), [1, 2, 3]);
  assert.ok(posts.every(p => p.body.sessionId === "srv-1"), "one session for the whole conversation");
  assert.equal(w.posts("/api/chat/session").length, 1, "the session is created once");
  assert.deepEqual(posts.map(p => p.body.message), ["a", "b", "c"]);
  assert.match(w.last(), /three/);
});

test("a temporary 502/503/504 is retried once with the same counter and answered once", async () => {
  for (const status of [502, 503, 504]) {
    const w = widget({
      "/api/chat/session": [ok({ sessionId: "s" })],
      "/api/chat/message": [{ status, body: {} }, ok({ response: "finally" })],
    });
    w.open();
    await w.say("wake up");
    const posts = w.posts("/api/chat/message");
    assert.equal(posts.length, 2, `status ${status}`);
    assert.deepEqual(posts.map(p => p.body.messageCount), [1, 1]);
    assert.equal(w.last(), "finally");
    assert.equal(w.text().filter(t => /finally/.test(t)).length, 1, "answered once");
  }
});

test("a dropped connection is retried once; a second failure shows the connection error", async () => {
  const dropOnce = widget({ "/api/chat/session": [ok({ sessionId: "s" })], "/api/chat/message": ["reject", ok({ response: "back" })] });
  dropOnce.open(); await dropOnce.say("hi");
  assert.equal(dropOnce.posts("/api/chat/message").length, 2);
  assert.match(dropOnce.last(), /back/);

  const down = widget({ "/api/chat/session": [ok({ sessionId: "s" })], "/api/chat/message": ["reject", "reject"] });
  down.open(); await down.say("hi");
  assert.equal(down.posts("/api/chat/message").length, 2, "retries once, then stops");
  assert.match(down.last(), /^Connection error\./);
  assert.equal(down.typing.style.display, "none");
  // The widget keeps working after a failure, and the counter moved on
  down.open();
  await down.say("again");
  assert.equal(down.posts("/api/chat/message").at(-1).body.messageCount, 2);
});

test("a timeout is not retried", async () => {
  const w = widget({ "/api/chat/session": [ok({ sessionId: "s" })], "/api/chat/message": ["abort"] });
  w.open(); await w.say("slow");
  assert.equal(w.posts("/api/chat/message").length, 1);
  assert.match(w.last(), /^Connection error\./);
});

test("a message is never dropped when the session cannot be created", async () => {
  const w = widget({
    "/api/chat/session": ["reject", "reject"],
    "/api/chat/message": [ok({ response: "got it" }), ok({ response: "again" })],
  });
  w.open();
  await w.say("first"); await w.say("second");
  const posts = w.posts("/api/chat/message");
  assert.equal(posts.length, 2);
  assert.match(posts[0].body.sessionId, /^session_[a-z0-9]+_\d+$/);
  assert.equal(posts[0].body.sessionId, posts[1].body.sessionId, "the fallback id stays the same");
  assert.match(w.last(), /again/);
});

test("a slow first reply (cold start) shows one waking-up notice, then the real reply", async () => {
  const w = widget({
    "/api/chat/session": [{ delay: 9000, ...ok({ sessionId: "s" }) }],
    "/api/chat/message": [{ delay: 9000, ...ok({ response: "awake" }) }],
  });
  w.open();
  await w.say("are you there?");
  const notices = w.text().filter(t => /Uplink is waking up/.test(t));
  assert.equal(notices.length, 1, "exactly one notice");
  assert.equal(w.last(), "awake");
  assert.equal(w.posts("/api/chat/message").length, 1, "the slow wait is not retried");
  assert.equal(w.typing.style.display, "none");
});

test("a fast reply shows no waking-up notice", async () => {
  const w = widget({ "/api/chat/session": [ok({ sessionId: "s" })], "/api/chat/message": [ok({ response: "quick" })] });
  w.open(); await w.say("hi");
  assert.ok(w.text().every(t => !/waking up/.test(t)));
});

test("429 and 413 replies from the service are shown as Iris's own words", async () => {
  const w = widget({
    "/api/chat/session": [ok({ sessionId: "s" })],
    "/api/chat/message": [{ status: 429, body: { response: "Easy, runner." } }, { status: 413, body: { response: "Too long." } }],
  });
  w.open();
  await w.say("a"); assert.equal(w.last(), "Easy, runner.");
  await w.say("b"); assert.equal(w.last(), "Too long.");
});

test("an unusable reply shows the existing fallback line", async () => {
  const w = widget({ "/api/chat/session": [ok({ sessionId: "s" })], "/api/chat/message": [{ status: 500, body: {} }] });
  w.open(); await w.say("x");
  assert.match(w.last(), /having trouble connecting to my systems/);
});

test("open and close still work and empty messages are ignored", async () => {
  const w = widget({ "/api/chat/session": [ok({ sessionId: "s" })] });
  w.open();
  assert.equal(w.container.style.display, "flex");
  await w.say("   ");
  assert.equal(w.posts("/api/chat/message").length, 0);
  w.close();
  assert.equal(w.container.style.display, "none");
});
