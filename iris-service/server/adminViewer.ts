// The read-only conversation viewer page. The page itself holds no data and no
// secrets; it asks for the administrator token and sends it with every request to
// /api/admin/*, which the server checks each time. The token is kept in memory only.
// Conversation text is only ever inserted with textContent, never as HTML.
export const ADMIN_VIEWER_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Iris conversations</title>
<style>
  :root { color-scheme: dark; --bg:#0b0b0e; --panel:#15151b; --line:#2a2a33; --text:#eaeaf0; --muted:#9a9aa8; --pink:#ff3366; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:15px/1.45 system-ui, sans-serif; }
  header { padding:12px 16px; border-bottom:1px solid var(--line); display:flex; flex-wrap:wrap; gap:8px 16px; align-items:center; }
  h1 { font-size:17px; margin:0; color:var(--pink); }
  #stats { color:var(--muted); font-size:13px; }
  .bar { padding:12px 16px; display:grid; gap:8px; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); border-bottom:1px solid var(--line); }
  input, select, button { background:var(--panel); color:var(--text); border:1px solid var(--line); border-radius:6px; padding:8px; font:inherit; min-width:0; }
  button { cursor:pointer; border-color:var(--pink); } button:disabled { opacity:.4; cursor:default; }
  main { display:grid; grid-template-columns:minmax(260px,380px) 1fr; min-height:60vh; }
  #list { border-right:1px solid var(--line); overflow:auto; max-height:75vh; }
  .item { display:block; width:100%; text-align:left; border:0; border-bottom:1px solid var(--line); border-radius:0; padding:10px 14px; }
  .item.active { background:#24141a; } .item small { color:var(--muted); display:block; }
  .item .snip { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  #pager { padding:10px 14px; display:flex; gap:8px; align-items:center; color:var(--muted); font-size:13px; }
  #detail { padding:12px 16px; overflow:auto; max-height:75vh; }
  .msg { margin:0 0 12px; padding:8px 12px; border-radius:8px; background:var(--panel); border-left:3px solid var(--line); }
  .msg.user { border-left-color:#5aa0ff; } .msg.iris { border-left-color:var(--pink); }
  .msg.bad { outline:1px solid #b8860b; }
  .meta { color:var(--muted); font-size:12px; margin-bottom:4px; }
  .text { white-space:pre-wrap; word-break:break-word; }
  #note { padding:12px 16px; color:var(--muted); }
  @media (max-width:720px) { main { grid-template-columns:1fr; } #list { border-right:0; max-height:40vh; border-bottom:1px solid var(--line); } }
</style>
</head>
<body>
<header><h1>Iris conversations</h1><span id="stats"></span></header>
<div class="bar">
  <input id="token" type="password" placeholder="Administrator token" autocomplete="off">
  <button id="connect">Connect</button>
</div>
<div class="bar">
  <input id="q" type="search" placeholder="Search text">
  <input id="session" placeholder="Session id contains">
  <input id="from" type="date" title="From (UTC)">
  <input id="to" type="date" title="To (UTC)">
  <select id="type"><option value="">All messages</option><option value="visitor">Visitor only</option><option value="iris">Iris only</option></select>
  <select id="status"><option value="">Any status</option><option value="ok">OK</option><option value="fallback">Fallback reply</option><option value="error">Error (no reply)</option></select>
  <button id="search">Search</button><button id="reset">Reset</button>
</div>
<div id="note">Enter the administrator token to load conversations. All times are UTC.</div>
<main>
  <section><div id="list"></div><div id="pager"></div></section>
  <section id="detail"></section>
</main>
<script>
(function () {
  var token = "", page = 1, pageSize = 25, active = null;
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function utc(iso) { return iso ? iso.slice(0, 10) + " " + iso.slice(11, 19) + " UTC" : ""; }
  function api(path, params) {
    var qs = new URLSearchParams();
    Object.keys(params || {}).forEach(function (k) { if (params[k] !== "" && params[k] != null) qs.set(k, params[k]); });
    return fetch(path + (qs.toString() ? "?" + qs : ""), { headers: { Authorization: "Bearer " + token }, cache: "no-store" })
      .then(function (r) {
        if (r.status === 401) throw new Error("Token rejected.");
        if (r.status === 429) throw new Error("Too many failed attempts. Wait and try again.");
        if (!r.ok) throw new Error("Request failed (" + r.status + ").");
        return r.json();
      });
  }
  function filters() {
    return { q: $("q").value.trim(), session: $("session").value.trim(), from: $("from").value, to: $("to").value,
             type: $("type").value, status: $("status").value, page: page, pageSize: pageSize };
  }
  function fail(e) { $("note").textContent = e.message; }
  function loadStats() {
    return api("/api/admin/stats").then(function (s) {
      $("stats").textContent = s.conversations + " conversations, " + s.messages + " messages (" + s.visitorMessages +
        " visitor, " + s.irisMessages + " Iris, " + s.errors + " errors)";
    });
  }
  function loadList() {
    return api("/api/admin/conversations", filters()).then(function (d) {
      $("note").textContent = d.total + " matching conversations, newest first. Times are UTC.";
      var list = $("list"); list.textContent = "";
      d.conversations.forEach(function (c) {
        var b = el("button", "item" + (c.sessionId === active ? " active" : ""));
        b.appendChild(el("small", "", utc(c.lastAt) + "  ·  " + c.messageCount + " messages" + (c.errorCount ? "  ·  " + c.errorCount + " errors" : "")));
        var snip = el("span", "snip", c.firstVisitorMessage || "(no visitor message)"); snip.setAttribute("dir", "auto"); b.appendChild(snip);
        b.appendChild(el("small", "", c.sessionId));
        b.onclick = function () { active = c.sessionId; loadList(); openConversation(c.sessionId); };
        list.appendChild(b);
      });
      var pages = Math.max(1, Math.ceil(d.total / pageSize));
      var pager = $("pager"); pager.textContent = "";
      var prev = el("button", "", "Previous"), next = el("button", "", "Next");
      prev.disabled = page <= 1; next.disabled = page >= pages;
      prev.onclick = function () { page--; loadList(); }; next.onclick = function () { page++; loadList(); };
      pager.appendChild(prev); pager.appendChild(el("span", "", "Page " + page + " of " + pages)); pager.appendChild(next);
    }).catch(fail);
  }
  function openConversation(id) {
    api("/api/admin/conversations/" + encodeURIComponent(id), { type: $("type").value }).then(function (d) {
      var box = $("detail"); box.textContent = "";
      box.appendChild(el("div", "meta", "Session " + d.sessionId + " · started " + utc(d.startedAt) + " · " + d.messages.length + " messages shown"));
      d.messages.forEach(function (m) {
        var row = el("div", "msg " + (m.sender === "user" ? "user" : "iris") + (m.status !== "ok" ? " bad" : ""));
        var who = m.sender === "user" ? "Visitor" : "Iris";
        if (m.status === "fallback") who += " (canned fallback reply)";
        if (m.status === "error") who += " (no reply produced)";
        row.appendChild(el("div", "meta", utc(m.timestamp) + " — " + who + (m.language ? " · " + m.language : "")));
        var t = el("div", "text", m.message); t.setAttribute("dir", "auto"); row.appendChild(t);
        box.appendChild(row);
      });
      if (window.innerWidth <= 720) box.scrollIntoView();
    }).catch(fail);
  }
  function refresh() { page = 1; loadStats().then(loadList).catch(fail); }
  $("connect").onclick = function () { token = $("token").value.trim(); $("token").value = ""; refresh(); };
  $("search").onclick = function () { page = 1; loadList(); };
  $("reset").onclick = function () { ["q","session","from","to","type","status"].forEach(function (id) { $(id).value = ""; }); page = 1; loadList(); };
  $("q").addEventListener("keydown", function (e) { if (e.key === "Enter") { page = 1; loadList(); } });
})();
</script>
</body>
</html>`;
