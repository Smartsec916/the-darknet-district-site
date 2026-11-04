# Homepage entrance patch (prepared, NOT applied)

**What it is.** `activate-homepage-entry.patch` is the homepage change that makes the Darknet District the entrance of the site: a button reading **ENTER THE DARKNET DISTRICT** that replaces the old "VOID//RUNNER, under construction" promotional block, with the line "No account needed. Guest progress stays in this browser." and a Log in link. It is PR #176's homepage change, taken out of the branch so that merging the branch does **not** publish it. David has asked for it to be prepared and **not** activated yet.

**What it touches.** Only `index.html` and `accents.css`. It also drops the page's `void-runner-backdrop.js` script (the teaser's decorative 3D backdrop), which today downloads the 3D engine for every visitor, phones included.

**Check it applies (changes nothing):**
```bash
git apply --check docs/development/homepage-entry/activate-homepage-entry.patch
```

**Activate (only after David approves, in its own pull request):**
```bash
git apply docs/development/homepage-entry/activate-homepage-entry.patch
npm test
```
Three tests read the entrance *through the patch* and then need to read `index.html` directly: `tests/darknet-entrance.test.cjs` (`patchedHomepage`), `tests/share-links-removed.test.cjs`, and the mobile-home step of `tests/integration-smoke-browser.cjs` (which then expects the button, and no teaser downloads). Also run `tests/site-navigation-browser.cjs`.

**Roll back:** `git apply -R docs/development/homepage-entry/activate-homepage-entry.patch`, or revert the activation commit.

**Phones.** The button leads to `void-runner.html`, where the device gate shows the landing page (no 3D, no game download, a link back to the site). The button may also be hidden on phones with a small script using `VoidDeviceGate.classify`.

**Checked.** The patched page was compared with the live page on a 1440x900 desktop and a Pixel 7 phone: the button matches the navigation's cut corners and green glow, does not overflow on a phone, and the navigation is unchanged.

**One entrance only.** Do not add a second game link on the homepage. David's earlier idea of making the title graphic itself clickable with a small ENTER tag is superseded by the wording above; ask him if he also wants the title to link to the same address.
