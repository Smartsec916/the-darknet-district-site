# Local preview of The Darknet District (integration build)

This runs the combined build of PRs #176 to #190 (without #184, which is obsolete now that share links are retired) **on your own computer only**. Nothing is published, uploaded or deployed, and the live website is not touched. It does not use GitHub Pages, any hosting service or any account.

## What you need
- A Windows PC or the ROG Ally (Windows), or a Mac or Linux computer.
- **Node.js** (free): install the "LTS" version from https://nodejs.org if `node -v` in a terminal does not print a version.
- A current Chrome or Edge.
- About 700 MB of free disk space.

## Get the files (pick one)

**A. Download a zip (no Git needed).** Open this address in your browser, wait for the download, and unzip it somewhere easy (for example `C:\darknet-preview`):

https://github.com/Smartsec916/the-darknet-district-site/archive/refs/heads/integration/darknet-district-preview.zip

**B. With Git:**

```bash
git clone --depth 1 --single-branch --branch integration/darknet-district-preview https://github.com/Smartsec916/the-darknet-district-site darknet-preview
```

## Start the preview
- **Windows:** open the folder and double-click **START-PREVIEW.bat**. Your browser opens the game by itself.
- **Mac or Linux:** in the folder, run `./start-preview.sh`.
- **Any system, by hand:** in the folder run

```bash
node tools/preview-server.cjs
```

then open http://127.0.0.1:5187/void-runner.html

To stop, close the window or press Ctrl+C. Run it again any time; nothing stays running in the background.

## Opening it from the ROG Ally while the server runs on your PC (optional)
Run the preview with `--lan` on the PC, then open the address it prints (it looks like `http://192.168.x.x:5187/void-runner.html`) on the Ally. Use this only on your home network and stop the preview afterwards. The simplest way, though, is to unzip and run the preview on the Ally itself.

## What works, and what does not
- **Works:** the whole 3D game, both graphics settings (Settings, then Graphics), the District and NeoChinatown, the transition through the security doors, local saves. (Share links that jumped to a chosen place are retired; a link that still carries `?visit=` simply opens the normal game.)
- **Not available in the preview:** logging in, cloud saves, the shop, Iris chat and anything else that needs the online services. The game says "network services offline"; that is expected.
- **Licensed art is missing:** the purchased city-pack buildings and the neon vending machine are not in the repository, so the preview shows the built stand-ins. The live site loads the real ones.
- **Saves are separate from the live site.** The preview uses its own browser storage (address 127.0.0.1), so it cannot touch your real saves or accounts. Clearing site data for 127.0.0.1 resets it.
- **Old campaigns are retired.** There is only one campaign now: the new Darknet District one. If a browser holds an older VOID//RUNNER campaign, the main menu says it was retired, keeps a copy under a separate key, and Continue stays unavailable until you start the new campaign. The preview address has no old saves, so you will normally not see this message here. The cloud save reset is a separate step that has **not** been run and waits for your approval (`docs/void-runner/SAVE-RESET.md`).
- If a page ever looks out of date after you replace the folder with a newer build, press Ctrl+Shift+R. The preview sends no cache headers and the game's own cache is versioned.

## A good ten-minute check
1. **New player.** Open the game, choose Campaign, then New (or Continue after your first save). You should start in the alley outside the District's double doors, with SHIP: NONE. The door should be readable, with a cool lamp over it and a faint violet trim. The landing pad (west along the street) should be empty, with no Kestrel and no boarding prompt.
2. **Go in.** Press E at the door, step into the vestibule, press E at the scanner (or walk in once you have a badge). A "SECURITY CHECKPOINT" panel should play for a couple of seconds and you should arrive in the same spot, with the inner door opening onto the hallway.
3. **Look around.** VR arcade, bar, Iris and Admin's counter, vending machines, sleep pods, the stairs to the smoking area. Talk to Admin and Iris; they should answer with short notices, with no missions offered.
4. **Come out.** Walk back out through the outer door. An "AIRLOCK" panel should play and you should arrive in the alley facing along it.
5. **Save and resume.** Rest in a sleep pod (progress saved), reload the page, choose Continue. You should reappear inside the hallway. Walk out, reload, Continue: you should be in the alley.
6. **Graphics.** Repeat steps 1 to 4 with Graphics set to Low. Both settings should work.
7. **Old shared links.** Open `http://127.0.0.1:5187/void-runner.html?visit=darknet-district&v=1`. It should just open the normal main menu (no jump into the District).
8. **Phone check (regular site).** On a phone, open the homepage from your PC's address only if you used `--lan`; otherwise skip. The real mobile site is unchanged and is not part of this preview.

## Report back
Anything odd (a stuck transition, a missing door, a prompt in the wrong place, a slow load) is worth a note with the graphics setting and what you were doing.
