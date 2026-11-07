// District account bridge. Tesana's game code and scoring stay local; Firebase UID is
// resolved by the shared site modules and verified again by /api/blackout/v2.
import type { Summary } from './game/world';
import { setSaveOwner, setSyncHook, hasLocalSave, saveSnapshot, replaceSave } from './game/state';
import type { SaveData } from './game/state';

interface Account {
  authReady(): Promise<unknown>;
  currentUser(): {uid: string} | null;
  signIn(): Promise<unknown>;
  signOut(): Promise<void>;
  registerHandle(handle: string): Promise<unknown>;
  tesanaLeaderboard(): Promise<{me?: {handle?: string; bestScore?: number; rank?: number}; entries?: Array<{handle: string; bestScore: number; highestCompletedLevel: number}>}>;
  tesanaStartRun(): Promise<{runId: string}>;
  tesanaCompleteLevel(runId: string, level: number, score: number, seconds: number, events: Record<string, number>): Promise<{completedLevel: number; personalBest: boolean}>;
  tesanaGetProgress(expectedUid: string): Promise<{progress: SaveData | null; revision: number}>;
  tesanaPutProgress(progress: SaveData, revision: number, expectedUid: string): Promise<{revision: number}>;
}
let account: Account | null = null;
let runId: string | null = null;
let runUid: string | null = null;
let submitQueue: Promise<unknown> = Promise.resolve();
let panel: HTMLElement;
let status: HTMLElement;
let board: HTMLElement;
let toggle: HTMLButtonElement;
let rankStatus: HTMLElement;
let saveStatus: HTMLElement;
let conflictActions: HTMLElement;
let cloudUid: string | null = null;
let cloudRevision = 0;
let cloudProgress: SaveData | null = null;
let cloudConflict = false;
let cloudBusy = false;
let cloudTimer: ReturnType<typeof setTimeout> | null = null;

const metaKey = (uid: string) => `blackout_protocol_cloud_meta_uid_${encodeURIComponent(uid)}`;
function readMeta(uid: string): {revision: number; snapshot: string} | null {
  try { const value = JSON.parse(localStorage.getItem(metaKey(uid)) || 'null');
    return value && Number.isInteger(value.revision) && typeof value.snapshot === 'string' ? value : null;
  } catch { return null; }
}
function writeMeta(uid: string, revision: number, snapshot: string): void {
  try { localStorage.setItem(metaKey(uid), JSON.stringify({revision, snapshot})); } catch { /* local play remains usable */ }
}
function showConflict(): void {
  cloudConflict = true;
  conflictActions.hidden = false;
  saveStatus.textContent = 'This browser and your account have different progress. Both copies are safe. Choose which to use in Account / Top 100.';
}
function queueCloudSave(): void {
  if (!cloudUid || cloudConflict) return;
  if (cloudTimer) clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => { cloudTimer = null; void uploadProgress(); }, 1200);
}
async function uploadProgress(): Promise<void> {
  const uid = cloudUid;
  if (!uid || cloudBusy || cloudConflict || account?.currentUser()?.uid !== uid) return;
  const snapshot = saveSnapshot();
  cloudBusy = true;
  try {
    const result = await account.tesanaPutProgress(JSON.parse(snapshot) as SaveData, cloudRevision, uid);
    if (cloudUid !== uid || account.currentUser()?.uid !== uid) return;
    cloudRevision = result.revision;
    cloudProgress = JSON.parse(snapshot) as SaveData;
    writeMeta(uid, cloudRevision, snapshot);
    saveStatus.textContent = 'Account progress saved. Ranked scores are verified separately.';
  } catch (error) {
    if (cloudUid !== uid) return;
    if ((error as Error & {status?: number}).status === 409) {
      try {
        const latest = await account.tesanaGetProgress(uid);
        if (cloudUid !== uid) return;
        cloudRevision = latest.revision; cloudProgress = latest.progress;
      } catch { /* local copy stays safe; reload can retry the account lookup */ }
      showConflict();
    }
    else saveStatus.textContent = 'Account save unavailable. Your progress remains in this browser; reload to retry.';
  } finally {
    cloudBusy = false;
    if (cloudUid === uid && !cloudConflict && cloudProgress && saveSnapshot() !== JSON.stringify(cloudProgress)) queueCloudSave();
    else if (cloudUid && cloudUid !== uid && !cloudConflict && hasLocalSave()) queueCloudSave();
  }
}
async function connectProgress(): Promise<void> {
  if (cloudTimer) clearTimeout(cloudTimer);
  cloudTimer = null; setSyncHook(null); cloudConflict = false; conflictActions.hidden = true;
  const uid = account?.currentUser()?.uid || null;
  cloudUid = uid;
  if (!uid) { saveStatus.textContent = 'Guest progress stays in this browser.'; return; }
  saveStatus.textContent = 'Checking account progress…';
  try {
    const remote = await account!.tesanaGetProgress(uid);
    if (cloudUid !== uid || account?.currentUser()?.uid !== uid) return;
    const local = saveSnapshot(), remoteSnapshot = remote.progress && JSON.stringify(remote.progress);
    const meta = readMeta(uid), hadLocal = hasLocalSave();
    cloudRevision = remote.revision; cloudProgress = remote.progress;
    if (remote.progress && (!hadLocal || local === remoteSnapshot ||
        (meta?.snapshot === local && remote.revision > meta.revision))) {
      if (local !== remoteSnapshot) {
        if ((window as any).__BP?.screen !== 'title') { showConflict(); return; }
        replaceSave(remote.progress);
      }
      writeMeta(uid, remote.revision, remoteSnapshot!);
      saveStatus.textContent = 'Account progress loaded. Ranked scores are verified separately.';
    } else if (remote.progress && local !== remoteSnapshot && meta?.revision !== remote.revision) {
      showConflict(); return;
    } else {
      saveStatus.textContent = 'Progress stays in this browser and syncs to your account when available.';
    }
    setSyncHook(queueCloudSave);
    if ((!remote.progress && hadLocal) || (remote.progress && saveSnapshot() !== remoteSnapshot)) queueCloudSave();
  } catch {
    saveStatus.textContent = 'Account save unavailable. Your progress remains in this browser; reload to retry.';
  }
}
async function loadCloudProgress(): Promise<void> {
  if (!cloudUid || !cloudProgress) return;
  setSyncHook(null); replaceSave(cloudProgress);
  writeMeta(cloudUid, cloudRevision, saveSnapshot());
  location.reload();
}
async function keepLocalProgress(): Promise<void> {
  const uid = cloudUid;
  if (!uid || !account || account.currentUser()?.uid !== uid ||
      !window.confirm('Replace the account copy with this browser\'s progress?')) return;
  try {
    const latest = await account.tesanaGetProgress(uid);
    if (cloudUid !== uid || account.currentUser()?.uid !== uid) return;
    const snapshot = saveSnapshot();
    const result = await account.tesanaPutProgress(JSON.parse(snapshot) as SaveData, latest.revision, uid);
    cloudRevision = result.revision; cloudProgress = JSON.parse(snapshot) as SaveData;
    writeMeta(uid, cloudRevision, snapshot);
    cloudConflict = false; conflictActions.hidden = true; setSyncHook(queueCloudSave);
    saveStatus.textContent = 'This browser\'s progress is now saved to your account.';
  } catch (error) { saveStatus.textContent = `Account save failed. Both copies remain available. ${String(error)}`; }
}

function element(tag: string, text = '', parent?: HTMLElement): HTMLElement {
  const node = document.createElement(tag);
  node.textContent = text;
  parent?.appendChild(node);
  return node;
}
function button(text: string, action: () => void, parent: HTMLElement): void {
  const b = element('button', text, parent) as HTMLButtonElement;
  b.type = 'button'; b.addEventListener('click', action);
}
function notice(message: string): void { if (status) status.textContent = message; }
function localOnly(message: string, offline = false): void {
  toggle.textContent = offline ? 'LOCAL PLAY · RANKINGS OFFLINE' : 'LOCAL PLAY · UNRANKED';
  rankStatus.textContent = `${message} Your progress stays in this browser; no ranked score was submitted.`;
}
function open(): void { panel.hidden = false; void refresh(); }
function close(): void { panel.hidden = true; }

async function refresh(): Promise<void> {
  if (!account) return;
  board.replaceChildren();
  const signedIn = account.currentUser();
  notice(signedIn ? 'Checking District account and fresh Tesana rankings…' : 'Guest play is available. Sign in to submit scores.');
  try {
    const data = await account.tesanaLeaderboard();
    toggle.textContent = 'ACCOUNT / TOP 100';
    const me = data.me;
    notice(signedIn ? (me?.handle ? `Signed in as ${me.handle} · Best ${me.bestScore || 0} · Rank ${me.rank || '—'}` : 'Signed in. Register a public District handle to submit scores.') : 'Guest · Top 100 is public');
    const list = element('ol', '', board);
    for (const row of data.entries || []) element('li', `${row.handle} · ${row.bestScore} · Sector ${row.highestCompletedLevel}`, list);
    if (!data.entries?.length) element('p', 'No scores yet. This is a new leaderboard.', board);
  } catch (error) {
    notice(error instanceof Error ? error.message : 'Rankings are unavailable.');
    localOnly('Account or leaderboard service is unavailable.', true);
  }
}

export async function initIntegration(): Promise<void> {
  toggle = element('button', 'ACCOUNT / TOP 100', document.body) as HTMLButtonElement;
  toggle.id = 'district-account-toggle'; toggle.type = 'button';
  panel = element('section', '', document.body); panel.id = 'district-account-panel'; panel.hidden = true;
  panel.setAttribute('aria-label', 'Blackout account and leaderboard');
  panel.addEventListener('keydown', event => event.stopPropagation());
  const head = element('header', 'BLACKOUT PROTOCOL · DISTRICT RANKINGS', panel);
  button('×', close, head);
  status = element('p', 'Connecting…', panel);
  rankStatus = element('p', 'Guest play saves locally. Ranked scores require a District account and a working leaderboard.', panel);
  saveStatus = element('p', 'Guest progress stays in this browser.', panel);
  const actions = element('div', '', panel); actions.className = 'district-actions';
  button('GOOGLE SIGN-IN', async () => { try { await account?.signIn(); await refresh(); } catch (error) { notice(String(error)); } }, actions);
  button('SIGN OUT', async () => { try { await account?.signOut(); runId = runUid = null; await refresh(); } catch (error) { notice(String(error)); } }, actions);
  const handle = element('input', '', actions) as HTMLInputElement;
  handle.placeholder = 'Public handle'; handle.maxLength = 20; handle.setAttribute('aria-label', 'Public handle');
  button('REGISTER HANDLE', async () => { try { await account?.registerHandle(handle.value.trim()); await refresh(); } catch (error) { notice(String(error)); } }, actions);
  button('REFRESH', () => void refresh(), actions);
  conflictActions = element('div', '', panel); conflictActions.className = 'district-actions'; conflictActions.hidden = true;
  button('LOAD ACCOUNT SAVE', () => void loadCloudProgress(), conflictActions);
  button('KEEP THIS BROWSER SAVE', () => void keepLocalProgress(), conflictActions);
  board = element('div', '', panel); board.className = 'district-board';
  toggle.addEventListener('click', () => panel.hidden ? open() : close());
  window.addEventListener('blackout-open-leaderboard', open);
  try {
    account = await import(/* @vite-ignore */ new URL('account.js', location.href).href) as Account;
    await account.authReady();
    setSaveOwner(account.currentUser()?.uid || null);
    void connectProgress();
    window.addEventListener('blackout-auth', () => {
      if (runUid && account?.currentUser()?.uid !== runUid) { runId = runUid = null; notice('Account changed. Start a new game for a ranked run.'); }
      setSyncHook(null);
      if (cloudTimer) clearTimeout(cloudTimer);
      cloudUid = null;
      if (setSaveOwner(account?.currentUser()?.uid || null)) location.reload();
      else void connectProgress();
      if (!panel.hidden) void refresh();
    });
  } catch { notice('Account services are unavailable. Guest play continues.'); localOnly('Account sign-in is unavailable.', true); }
  void refresh();
}

export function startTesanaRun(): void {
  runId = runUid = null;
  submitQueue = Promise.resolve();
  const user = account?.currentUser();
  if (!account || !user) { rankStatus.textContent = 'Guest run. Progress saves in this browser; no ranked score will be submitted.'; return; }
  runUid = user.uid;
  rankStatus.textContent = 'Starting a ranked run…';
  submitQueue = account.tesanaStartRun().then(data => {
    if (account?.currentUser()?.uid === runUid) { runId = data.runId; rankStatus.textContent = 'Ranked run active. Scores submit after each completed sector.'; }
  }).catch(error => { runId = null; localOnly(`Ranked run could not start: ${String(error)}.`); });
}

export function recordTesanaLevel(summary: Summary): void {
  if (!account || !runUid || account.currentUser()?.uid !== runUid) return;
  submitQueue = submitQueue.then(async () => {
    if (!runId || account?.currentUser()?.uid !== runUid) return;
    const result = await account.tesanaCompleteLevel(runId, summary.idx + 1, summary.totalScore, summary.time, summary.events);
    milestone('level_completed', {level: summary.idx + 1, score: summary.totalScore, shards: summary.shards});
    if (summary.idx === 11) milestone('game_completed', {score: summary.totalScore});
    if (summary.shards === 3) milestone('collectible_milestone', {level: summary.idx + 1, shards: 3});
    if (result.personalBest) milestone('personal_best', {score: summary.totalScore, level: summary.idx + 1});
    for (const threshold of [10_000, 50_000, 100_000]) if (summary.totalScore >= threshold && summary.totalScore - summary.score < threshold) milestone('score_milestone', {score: summary.totalScore, threshold});
    if (result.completedLevel === 12) runId = null;
    rankStatus.textContent = `Sector ${result.completedLevel} ranked score accepted.`;
    if (!panel.hidden) void refresh();
  }).catch(error => { runId = null; localOnly(`Ranked score was rejected: ${String(error)}.`); });
}

// Stable, reusable milestone envelope for the future site-wide achievements service.
// This does not write achievements or trust browser claims as verified awards.
export function milestone(kind: string, data: Record<string, number | string>): void {
  window.dispatchEvent(new CustomEvent('district-game-milestone', {detail: {gameId: 'blackout-protocol', version: 'tesana-2026-11-06', kind, ...data}}));
}
