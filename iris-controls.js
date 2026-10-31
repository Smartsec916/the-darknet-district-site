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

function render(state) {
  document.querySelectorAll('.mode').forEach(button => button.setAttribute('aria-checked', String(button.dataset.mode === state.mode)));

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

async function reset(target) {
  const label = target === 'new' ? 'the New Visitor' : 'the Returning Visitor';
  if (!window.confirm(`Reset ${label} simulation? It will start over as a stranger.`)) return;
  const { status, data } = await call('/api/owner/reset', { method: 'POST', body: { target } });
  say(status === 200 ? `${label} reset.` : (data.error || 'Could not reset.'), status !== 200);
  await refresh();
}

document.querySelectorAll('.mode').forEach(button => button.addEventListener('click', () => chooseMode(button.dataset.mode)));
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
