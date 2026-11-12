# First unlisted live test: what merging does, how to back up, how to roll back

Written 2026-11-04 for David and for Codex. **Nothing in this file has been done.** No merge, no deployment, no change to production data, configuration or secrets.

The test uses the existing address `https://thedarknetdistrict.com/void-runner.html` (no `/district-test/` copy). The old Void Runner identity is retired; The Darknet District is the game.

## 1. What merging into `main` triggers (verified from the repository and GitHub)

| System | What happens | Evidence |
|---|---|---|
| **GitHub Pages (the website and the game)** | **Publishes automatically.** `.github/workflows/pages.yml` runs on every push to `main`: it builds `_site` (every tracked file except paths starting `.` or `_` and `exports/`, plus the encrypted licensed models from the private repository), then the `deploy` job publishes it. Pull requests run the build and checks but do not deploy. | `pages.yml`; GitHub's deployment list for the repository shows `github-pages` deployments from `main` about daily (for example 2026-11-02 and 2026-11-03). |
| **Tests on `main`** | `tests.yml` runs on every push to `main` and on every PR: Node unit tests, Python API tests and the "Babylon stabilization smoke" browser test. | Check runs listed on the latest `main` commit. |
| **Iris service (the chatbot)** | **Not affected.** It is a separate Render service (`iris-service/render.yaml`, name `iris-chat`) with `autoDeploy: false`, deployed only by hand. This build changes nothing under `iris-service/` and nothing in `identity_api.py` or `chatbot.html`. | `git diff main..integration/codex-start` lists no such file. |
| **Neon (the Iris database)** | **Not affected.** Only `iris-service` uses it (`DATABASE_URL`). The game never talks to it. | `grep` for `DATABASE_URL`/`neon`: only `iris-service/`. |
| **The game's own API (`server.py`, `void_runner_api.py`, on Render)** | **Unknown, and David must check.** Its deploy settings are not in the repository (the only `render.yaml` is the Iris one), and GitHub shows no Render deployments. If its Render service has Auto-Deploy on for `main`, the merge will redeploy it. This build changes one backend file, `void_runner_api.py`: it now **refuses to store a cloud save from before the District reset (HTTP 409 with a plain message)** and `GET /account` reports `retired: true` and does not return that save. **It never deletes anything.** Rolling the code back restores the old behaviour; the stored records are untouched either way. | `git diff main..integration/codex-start -- void_runner_api.py`; `docs/void-runner/SAVE-RESET.md`. |
| **Firestore (cloud saves, orders, handles)** | Not modified by deployment. The save reset tool (`tools/reset-void-runner-saves.py`) is **not** part of any workflow and has **not** been run. | |
| **Authentication and guest sessions** | Account sign-in (Firebase) is unchanged. A guest is a local-only player: no account, no server record. Share links and their guest sessions were removed, and an old `?visit=` address now just opens the normal menu. | #189, `tests/share-links-removed.test.cjs`. |

**Before merging, ask David to open the Render dashboard for the game API and tell Codex: is Auto-Deploy on, and for which branch?** If it is on and he does not want the stricter save check live yet, turn it off or deploy the website first and the API second (the new client works against the old API for guests; for account users the old API would accept an old-format cloud save that the new client then retires locally, which is safe but confusing).

## 2. Service worker, caching and browser storage

- **Service worker** (`void-runner-sw.js`): the page itself is fetched **network first** (so a new deploy is found at once, with the cached copy used only when offline). Game scripts, images and models are served **from a cache named for the build**; the deploy stamps `BUILD` with the commit, so every deploy starts a fresh cache and deletes older ones when the new worker activates (`skipWaiting` and `clients.claim`, so it takes over immediately).
- **What David will see after a deploy:** his first load gets the new page. A tab that was already open during the deploy can run a mixture of old and new files until it is reloaded. A hard refresh (Ctrl+Shift+R) avoids any doubt.
- **Phones:** the device gate stops the game before `cache.js` runs, so a phone **registers no service worker** and downloads no game file. A phone that visited the old game earlier still has the old worker, which only handles the game page and `void-runner/` files; it fetches the new gated page from the network and shows the landing page.
- **Storage keys the game uses (same address as the live site, so the test shares them):**
  - `void-runner-campaign-v1`: **the campaign** (the only key the retirement touches).
  - `void-runner-campaign-v1.retired`, `.retired.2`, `.retired.3`...: verified copies of retired campaigns, created by the new build.
  - `void-runner-graphics-v1` (quality), `void-runner-audio-v1`, `void-runner-controls-v1`, `void-runner-voices-v1`, `void-runner-companion-looks-v1`, `void-runner-companion-party-v1`: settings, untouched.
  - New and local only: `darknet-pod-music-keep` (the "keep my songs" choice), `darknet-pod-music-site` (testers only), `tdd-force-3d` (a tablet's "try anyway", session only), and the browser database `darknet-pod-music` (kept songs, only if the player ticks the box).
- **Can the test overwrite an old campaign?** Before this branch: **yes, in one case**. A second retired campaign would be deleted without a copy because the first copy already occupied the key. **Fixed:** retirement now writes `.retired`, then `.retired.2`, and so on, checks each copy reads back identical, and removes the active slot only afterwards. If the copy cannot be made (full storage, 20 copies) the original is left alone and saving is switched off, so nothing can overwrite it. (`tests/legacy-retirement.test.cjs`.)
- **Cloud saves are never deleted by the client or by the deploy.**

## 3. Backup before the first test (simple steps for David)

Do this **on the live site, in the same browser you played in, before the new build goes live.** It makes a file you keep.

1. Open `https://thedarknetdistrict.com/void-runner.html`. Wait for the menu.
2. Press **F12** (or Ctrl+Shift+I), then click the **Console** tab.
3. If the browser says pasting is blocked, type `allow pasting` and press Enter.
4. Paste this and press Enter. A file named `darknet-district-local-backup-<date>.json` downloads:
```js
(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^void-runner|^darknet-pod|^tdd-/.test(k))o[k]=localStorage.getItem(k);}
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o,null,1)],{type:'application/json'}));
a.download='darknet-district-local-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();console.log('saved keys:',Object.keys(o));})()
```
5. Check the console prints the keys, including `void-runner-campaign-v1`, and that the file is more than a few hundred bytes. Keep the file somewhere safe (not only on this PC).
6. **Cloud save:** if you play with an account, press the account button in the game and note the saved date. Nothing is deleted by the new build, but a second note does no harm.

After the new build is live, the **main menu** shows "An earlier campaign is kept safely in this browser" with a **Download the earlier campaign as a backup** button (a second, in-game way to get the same file). *(Removed 2026-11-12: the menu no longer offers this download. The retired copies are still kept untouched in the browser storage.)*

## 4. Restoring, and rolling back

### 4.1 Restoring a retired campaign into the same browser
Only useful for the **old** build, because the new build retires any campaign without the new campaign marker again.
1. On the page, F12, Console.
2. Copy a retired copy back (replace `.retired` with `.retired.2` and so on to choose another):
```js
localStorage.setItem('void-runner-campaign-v1', localStorage.getItem('void-runner-campaign-v1.retired'))
```
3. Or restore from the downloaded backup file: open the JSON, copy its text, and run `const d=<paste the whole JSON here>; for(const [k,v] of Object.entries(d)) localStorage.setItem(k,v);`.
4. If a new District campaign exists in the active slot first, **copy it elsewhere before overwriting** (`localStorage.setItem('district-new-backup', localStorage.getItem('void-runner-campaign-v1'))`).

### 4.2 Rolling back the code
1. In GitHub, open the merged pull request and use **Revert**, or run `git revert -m 1 <merge-commit>` on a new branch and open a PR to `main`; merge it. (Reverting a Git commit does not need a force push and keeps history.)
2. The push redeploys the website in a few minutes. The deploy stamps a new `BUILD`, so browsers drop the new cache. Ask players (David) for a hard refresh.
3. If the game API was redeployed by the merge and must go back, redeploy the previous version in the Render dashboard (**Manual Deploy > a previous commit**). Stored records are unchanged.
4. **Reverting code does not undo browser state.** The new build may already have moved a campaign to `.retired` and freed the active slot, and may have started a new campaign. The old build then sees an empty slot. Restore with section 4.1 (from `.retired` or from the backup file in section 3). A new District campaign made during the test is **not** readable by the old build: keep its copy if it matters.
5. **Cached assets:** to force a clean state in one browser: DevTools > Application > Storage > **Clear site data** (this also clears saves, so back up first), or only the cache: in the console run `caches.keys().then(k=>Promise.all(k.map(n=>caches.delete(n))))` and `navigator.serviceWorker.getRegistrations().then(r=>r.forEach(x=>x.unregister()))`, then reload.
6. **Homepage:** unchanged by this build (the ENTER button is a separate patch), so there is nothing to roll back there.

## 5. Deployment checklist (do in this order; David approves each step that changes anything live)
1. [ ] David reads and approves `CODEX_HANDOFF.md` section "Approvals".
2. [ ] David backs up his local save (section 3).
3. [ ] David checks the Render dashboard for the game API Auto-Deploy setting and tells Codex (section 1).
4. [ ] David decides the 27-song playlist: stays **off** in the game (default) or is switched on (`MUSIC_LICENSING.md`).
5. [ ] Open one pull request from the branch to `main` (not the stacked PRs). Read the PR build and the three CI checks: all green.
6. [ ] Run the checks that need David's own PC (section 7) against a local copy (`START-PREVIEW.bat`).
7. [ ] David merges. Pages publishes.
8. [ ] Post-deploy smoke, in order: the normal pages (home, about, shop, arcade list) look unchanged and have no console errors; the homepage still shows the Void Runner teaser; `/void-runner.html` loads in Edge/Chrome with no console errors; a **phone** shows the landing page and the back link works; guest **New** campaign starts in the alley; the door and the interior; a pod rests and saves; reload and **Continue**; the music screen plays a song from the PC; the **Back to website** button works; the Iris widget is **absent** on the game page.
9. [ ] If anything is wrong: roll back (section 4.2).

## 6. Things that will NOT be touched by this build
Production databases, Firestore records, the Iris service, Neon, Render configuration, secrets, the homepage, the public Arcade page beyond removing the game's card, and any user's cloud save.

## 7. Checks that need David's own PC (software rendering cannot answer them)
- Real frame rates at Low and High on the PC and on the ROG Ally, in the street and in the District interior (look at both the hall and the pod room).
- The look of the licensed city-pack buildings and the neon vending machine (absent from the open repository; present on the deployed site).
- Windows high-DPI scaling and a 1366x768 or 1280x720 window (the music panel was tested at 1280x720 only).
- Gamepad controls on the Ally (the controls code is unchanged; no gamepad was available to test).
- Hardware acceleration on in Edge and Chrome (the device gate explains if WebGL is missing).
- That the browser's file picker works for songs (it does in Chromium; Edge is Chromium).
