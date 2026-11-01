/*
==============================================================================
IRIS CONTROLS: the administrator's private panel.

Reachable from the account menu for the administrator only. This page holds no
secret and shows nothing on its own: every number comes from the Iris server,
which verifies the signed-in account against its administrator list on each
request. A visitor who opens this address just sees "not authorized".
==============================================================================
*/
import { auth, onAuthStateChanged } from './firebase-auth.js';
import { irisBase } from './iris-account-core.js';

const base = irisBase(location.hostname, window.IRIS_API_BASE);
const $ = id => document.getElementById(id);
const gate = $('gate'), panel = $('panel'), note = $('note');
let user = null;
let timer = null;

function say(text, isError = false) { note.textContent = text; note.dataset.state = isError ? 'error' : 'ok'; }

async function call(path, { method = 'GET', body } = {}) {
  const token = await user.getIdToken();
  const response = await fetch(base + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
const fixed = (n, d = 2) => (typeof n === 'number' ? n.toFixed(d) : '—');

function meter(label, value, min, max) {
  const row = el('div', undefined, 'meter');
  row.append(el('b', label));
  const bar = el('span', undefined, 'bar');
  const fill = document.createElement('i');
  fill.style.width = `${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))}%`;
  bar.append(fill);
  row.append(bar, el('span', ` ${fixed(value)}`));
  return row;
}

function describeRelationship(rel) {
  if (!rel) return el('p', 'Nothing saved yet.', 'muted');
  const wrap = document.createElement('div');
  wrap.append(
    el('div', `Mood: ${rel.mood}`),
    meter('Trust', rel.trust, -1, 5),
    meter('Familiarity', rel.familiarity, 0, 1),
    meter('Affection', rel.affection, 0, 1),
    meter('Respect', rel.respect, 0, 1),
    meter('Playfulness', rel.playfulness, 0, 1),
    el('div', `Visits ${rel.visits} · messages ${rel.messages} · last seen ${rel.lastSeen ?? 'never'}`, 'muted'),
    el('div', `Flirting: ${rel.minor ? 'OFF permanently (possible minor)' : rel.flirtCooldown === 0 ? 'allowed' : 'paused'}`, 'muted'),
  );
  if (rel.preferences.length) wrap.append(el('div', `Remembered: ${rel.preferences.join('; ')}`, 'muted'));
  if (rel.recap) wrap.append(el('div', `Recap: ${rel.recap}`, 'muted'));
  return wrap;
}

const DELETE_CONFIRMATION = 'delete my memories';

// What the latest request carried, in words
const REQUEST_MODES = {
  grounded: count => `${count} matching stored message(s) were given to Iris`,
  partial: () => 'no exact match; her latest earlier conversation was given instead',
  absent: () => 'nothing to recall: Iris was told she has no record (only a short notice was sent, no stored messages)',
  failed: () => 'her memory could not be read: Iris was told so',
  unrecognized: () => 'this visitor cannot be remembered between visits: Iris was told so',
  none: count => (count ? `${count} stored message(s) of recent context were given to Iris` : 'no stored messages were needed'),
};

function renderMemory(memory) {
  const box = $('memory'); box.replaceChildren();
  const row = (label, value, detail) => {
    const line = el('div', undefined, 'meter');
    line.append(el('b', label), el('span', value), ...(detail ? [el('span', ' ' + detail, 'muted')] : []));
    box.append(line);
  };
  row('Persistent memory', memory.enabled ? 'ON' : 'OFF', memory.enabled ? '' : 'Iris is not reading stored conversations');
  row('Stored messages', memory.storesConversations ? String(memory.storedMessages ?? 'unavailable') : 'none (a New Visitor is never stored)',
    memory.storesConversations ? `filed under this identity${memory.linkedBrowsers ? `, including ${memory.linkedBrowsers} connected browser(s)` : ''}` : '');
  row('Retention', memory.retention);
  const latest = memory.latestRequest;
  row('Latest request', latest ? (REQUEST_MODES[latest.mode] ?? REQUEST_MODES.none)(latest.messagesIncluded) : 'no memory was needed yet',
    latest ? `(about ${latest.approxTokens} tokens${latest.ok ? '' : ', lookup failed'})` : '');
  const added = memory.estimatedAddedTokens;
  row('Added by memory (since the service started)', `${added.requestsWithMemory} request(s), about ${added.tokens} tokens`, added.tokens ? `≈ $${added.costUSD} at list price` : '');
  row('Lookup errors (recent)', String(memory.lookupFailuresRecent), 'a lookup that finds nothing is not an error');
  const fb = memory.fallbacks;
  const reasons = Object.entries(fb.byReason).map(([k, v]) => `${k} ×${v}`).join(', ');
  row('OpenAI canned replies', `${fb.last24hInDatabase ?? '?'} in 24 h`, `since the service started: ${fb.sinceServerStart}${reasons ? ' (' + reasons + ')' : ''}`);

  const mix = memory.identityMix;
  if (mix) {
    row('Visitor messages, last 24 h, by who they were filed under', `owner/test ${mix.owner} · signed-in accounts ${mix.account} · browsers ${mix.browser} · nobody ${mix.none}`);
    if (mix.noneLastHour > 0) {
      const warn = el('p', `⚠ ${mix.noneLastHour} visitor message(s) in the last hour were saved under nobody. If one of them was yours, your sign-in was not attached to it, or Iris was in New Visitor mode.`, 'banner');
      box.append(warn);
    }
  }
  if (memory.server) row('Server', memory.server.version ? `version ${memory.server.version}` : 'version not reported', `started ${memory.server.startedAt.replace('T', ' ').slice(0, 19)} UTC`);

  if (memory.lastLookups.length) {
    const table = document.createElement('table');
    const head = table.createTHead().insertRow();
    for (const text of ['When (UTC)', 'Lookup', 'Result', 'Given to Iris', 'Rows searched', 'Left out: already in this chat', 'Left out: earlier questions', 'ms']) head.append(el('th', text));
    const body = table.createTBody();
    for (const l of memory.lastLookups) {
      const r = body.insertRow();
      [l.at.replace('T', ' ').slice(0, 19), l.kind === 'recent' ? 'recent history' : 'recall search', l.ok ? 'ok' : 'FAILED: ' + l.failure,
        l.found, l.candidates ?? '—', l.excludedAsInChat ?? '—', l.droppedAsRecallQuestions ?? '—', l.ms].forEach(text => r.insertCell().textContent = String(text));
    }
    box.append(table);
    box.append(el('p', 'Given to Iris = stored messages sent to the model. 0 with "ok" means the search worked and nothing matched.', 'muted'));
  }
}

function render(state) {
  document.querySelectorAll('.mode').forEach(button => button.setAttribute('aria-checked', String(button.dataset.mode === state.mode)));
  const banner = $('modeBanner');
  banner.hidden = state.mode === 'owner';
  banner.textContent = state.mode === 'new'
    ? 'You are in NEW VISITOR mode. Iris treats you as a stranger and nothing you say is saved for recall. Switch to OWNER to test or use real memory.'
    : state.mode === 'returning'
      ? 'You are in RETURNING VISITOR mode: a separate test visitor, not your own memory. Switch to OWNER to use your own.'
      : '';

  const live = $('live'); live.replaceChildren();
  const active = state.identities[state.mode];
  live.append(el('div', `Mode: ${state.mode.toUpperCase()}`));
  if (state.active.live) {
    live.append(el('div', `Current mood: ${state.active.live.mood}`), meter('Trust (live)', state.active.live.trust, -1, 5),
      el('div', `Messages in the current chat: ${state.active.live.messagesThisChat}`, 'muted'));
  } else {
    live.append(el('p', 'No open chat for this identity yet. Send a message on the homepage.', 'muted'));
  }
  if (active?.relationship) live.append(describeRelationship(active.relationship));
  else if (state.mode === 'new') live.append(el('p', 'New Visitor mode remembers nothing between chats.', 'muted'));

  const persist = $('persist'); persist.replaceChildren();
  const status = (label, on, detail) => {
    const row = el('div', undefined, 'meter');
    row.append(el('b', label), el('span', on ? 'ON' : 'OFF', `pill ${on ? 'on' : 'off'}`), el('span', detail ? ` ${detail}` : '', 'muted'));
    persist.append(row);
  };
  status('Emotion system', state.persistence.emotionSystem === 'on');
  status('Database', state.persistence.database, state.persistence.database ? '' : 'unreachable: memory is not being saved');
  status('Memory kept', true, `${state.persistence.retentionDays} days without a visit`);
  status('Flirt level', state.persistence.flirtLevel > 0, `${state.persistence.flirtLevel} of 3`);

  const usage = $('usage'); usage.replaceChildren();
  if (state.usageLast24h) {
    usage.append(
      el('div', `Model calls: ${state.usageLast24h.calls}`),
      el('div', `Tokens in / out: ${state.usageLast24h.inputTokens} / ${state.usageLast24h.outputTokens}`),
      el('div', `Estimated cost: $${state.usageLast24h.estimatedCostUSD} (list prices)`),
    );
  } else usage.append(el('p', 'Unavailable.', 'muted'));

  renderMemory(state.memory);

  const ids = $('identities'); ids.replaceChildren();
  const table = document.createElement('table');
  const head = table.createTHead().insertRow();
  for (const text of ['Identity', 'Mood', 'Trust', 'Familiarity', 'Affection', 'Visits', 'Messages', 'Stored']) head.append(el('th', text));
  const body = table.createTBody();
  for (const [name, data] of Object.entries(state.identities)) {
    const row = body.insertRow();
    const rel = data.relationship;
    const cells = [name.toUpperCase() + (data.resets ? ` (reset ${data.resets}×)` : ''), rel?.mood ?? '—', fixed(rel?.trust), fixed(rel?.familiarity), fixed(rel?.affection), rel?.visits ?? '—', rel?.messages ?? '—', data.persistent ? (rel ? 'yes' : 'empty') : 'never'];
    cells.forEach(text => row.insertCell().textContent = String(text));
  }
  ids.append(table);

  const changes = $('changes'); changes.replaceChildren();
  if (!state.active.recentChanges.length) changes.append(el('p', 'No changes recorded since the service started.', 'muted'));
  else {
    const t = document.createElement('table');
    const h = t.createTHead().insertRow();
    for (const text of ['When (UTC)', 'Mood', 'Trust', 'Change', 'Warmth', 'Hostility', 'Flirt', 'Humor', 'Read']) h.append(el('th', text));
    const b = t.createTBody();
    for (const e of state.active.recentChanges) {
      const row = b.insertRow();
      [e.at.replace('T', ' ').slice(0, 19), e.moodChanged ? `${e.mood} (changed)` : e.mood, fixed(e.trust), (e.trustDelta > 0 ? '+' : '') + fixed(e.trustDelta), e.warmth, e.hostility, e.flirt, e.humor, e.read ? 'yes' : 'no line']
        .forEach(text => row.insertCell().textContent = String(text));
    }
    changes.append(t);
  }
}

async function refresh() {
  const { status, data } = await call('/api/owner/state');
  if (status === 401 || status === 403 || status === 404) { showGate('This account is not authorized for Iris controls.'); return false; }
  if (status !== 200) { say('Iris did not answer. It may be waking up; try again in a moment.', true); return true; }
  gate.hidden = true; panel.hidden = false;
  render(data);
  return true;
}

function showGate(text) { gate.hidden = false; gate.textContent = text; panel.hidden = true; clearInterval(timer); }

async function chooseMode(mode) {
  const { status, data } = await call('/api/owner/mode', { method: 'POST', body: { mode } });
  say(status === 200 ? `Mode set to ${data.mode.toUpperCase()}. It applies to your next chat message.` : (data.error || 'Could not change the mode.'), status !== 200);
  await refresh();
}

async function deleteMemory(target) {
  const label = target === 'owner' ? "the owner's" : 'the Returning Visitor simulation\'s';
  if (!window.confirm(`Delete ${label} stored conversations?\n\nIris will no longer be able to recall them. This cannot be undone. Relationship records and the other identity are not affected.`)) return;
  const { status, data } = await call('/api/owner/memory/delete', { method: 'POST', body: { target, confirm: DELETE_CONFIRMATION } });
  say(status === 200 ? `Deleted ${data.deleted ?? 0} stored messages.` : (data.error || 'Could not delete.'), status !== 200);
  await refresh();
}

// The outcome is shown right under the form, stays until the next action, and says exactly what happened
function adoptResult(text, state) { const out = $('adoptResult'); out.textContent = text; out.dataset.state = state; }
const when = iso => (iso ? iso.replace('T', ' ').slice(0, 16) + ' UTC' : 'unknown time');

async function summarize(sessionId) {
  const { status, data } = await call('/api/owner/session-summary?sessionId=' + encodeURIComponent(sessionId));
  if (status !== 200) { adoptResult(data.error || 'Could not look that session up.', 'error'); return null; }
  return data;
}

function describe(summary) {
  return `${summary.messages} message(s), ${when(summary.firstAt)} to ${when(summary.lastAt)}: ${summary.unkeyed} not filed under anyone, ${summary.filedUnderOwner} already in your owner memory, ${summary.filedElsewhere} filed under someone else.`;
}

async function check() {
  const sessionId = $('adoptSession').value;
  if (!sessionId.trim()) { adoptResult('Paste a session id first.', 'warn'); return; }
  adoptResult('Looking…', 'warn');
  const summary = await summarize(sessionId);
  if (!summary) return;
  if (!summary.found) { adoptResult('No session with that ID was found. Check the ID (copy it from the database instead of typing it).', 'error'); return; }
  adoptResult(`Found. ${describe(summary)}${summary.unkeyed ? ' Adopting would file the unfiled ones under your owner memory.' : ' Nothing in it can be adopted.'}`, summary.unkeyed ? 'ok' : 'warn');
}

async function adopt() {
  const sessionId = $('adoptSession').value;
  if (!sessionId.trim()) { adoptResult('Paste a session id first.', 'warn'); return; }
  adoptResult('Looking…', 'warn');
  const summary = await summarize(sessionId);
  if (!summary) return;
  if (!summary.found) { adoptResult('No session with that ID was found. Nothing was changed. Check the ID (copy it from the database instead of typing it).', 'error'); return; }
  if (!summary.unkeyed) { adoptResult(`Nothing to adopt. ${describe(summary)}`, 'warn'); return; }
  if (!window.confirm(`Add ${summary.unkeyed} message(s) from this session to the owner's memory?\n\n${describe(summary)}\n\nOnly messages that belong to no one are added. Make sure this chat was yours.`)) { adoptResult('Cancelled. Nothing was changed.', 'warn'); return; }
  const { status, data } = await call('/api/owner/adopt-session', { method: 'POST', body: { sessionId } });
  if (status === 200) {
    adoptResult(`Adopted ${data.adopted} message(s) into the owner's memory. That session now has ${data.filedUnderOwner} message(s) filed under you.`, 'ok');
    $('adoptSession').value = '';
  } else {
    adoptResult(data.error || 'Could not adopt that session. Nothing was changed.', status === 409 ? 'warn' : 'error');
  }
  await refresh();
}

async function reset(target) {
  const label = target === 'new' ? 'the New Visitor' : 'the Returning Visitor';
  if (!window.confirm(`Reset ${label} simulation? It will start over as a stranger.`)) return;
  const { status, data } = await call('/api/owner/reset', { method: 'POST', body: { target } });
  say(status === 200 ? `${label} reset.` : (data.error || 'Could not reset.'), status !== 200);
  await refresh();
}

document.querySelectorAll('.mode').forEach(button => button.addEventListener('click', () => chooseMode(button.dataset.mode)));
$('deleteOwnerMemory').addEventListener('click', () => deleteMemory('owner'));
$('deleteReturningMemory').addEventListener('click', () => deleteMemory('returning'));
$('adoptButton').addEventListener('click', adopt);
$('checkButton').addEventListener('click', check);
$('resetNew').addEventListener('click', () => reset('new'));
$('resetReturning').addEventListener('click', () => reset('returning'));
$('refresh').addEventListener('click', () => { say(''); refresh(); });

onAuthStateChanged(auth, async current => {
  user = current;
  clearInterval(timer);
  if (!current) { showGate('Log in from the homepage first, then open Iris Controls from the account menu.'); return; }
  gate.textContent = 'Checking your access…';
  if (await refresh()) timer = setInterval(() => { if (!document.hidden) refresh(); }, 15000);
});
