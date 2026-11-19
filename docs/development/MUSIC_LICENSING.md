# The 27-song playlist: where the songs came from and what is and is not verified

Written 2026-11-04. **Status: SETTLED for the game's use (updated 2026-11-08; see the update below).** David held a paid Riffusion subscription when the songs were created in 2025, so the free tier's non-commercial limitation does not apply. On `main` as of 12 Nov 2026, `WEBSITE_PLAYLIST` in `void-runner/pod-music.js` is **`true`** (the 4 Nov "off by default" lines in section 7 are the older state). The website's own Sleeping Pod page is unchanged.

## Update 2026-11-08: rights settled for the game (David's statement)
- David confirms he held a **paid Riffusion subscription in 2025, when the 27 songs were created**. That is also why their quality is better than the free plan's output.
- The free tier's non-commercial limitation therefore **does not apply** to these songs. The March to April 2026 Starter receipt is a later paid period, not the one the songs were made under.
- **The music rights are considered settled for the game's use.** The analysis below is kept as the earlier record; where it calls the rights unverified or asks for 2025 evidence, this update supersedes it.
- Settlement here means David may use the songs in the game. It is not a finding that the files may be redistributed, sublicensed, or used for AI training. `CLAUDE.md` already says the same.

## 1. What David told us
- All 27 songs on the website's Sleeping Pod playlist were created by David with **Riffusion.org / Producer.ai**.
- David has evidence of a **paid Producer "Starter" subscription: a $8 payment on 17 March 2026, covering 17 March to 17 April 2026.** (Claude Code was told this; the receipt itself was not provided to it, so it is recorded here as David's statement.)
- Riffusion uses the label **"(Cover)"** when David remixes his **own** songs. The "(Cover)" files are therefore treated as **David's self-remixes**, not covers of other people's compositions, unless evidence says otherwise. The repository holds no evidence either way; this is David's statement. His original source recordings should be kept (section 6).

## 2. What the repository itself shows (measured, not assumed)
| # | File in `attached_assets/` | Length | Size | First added to the repository (GitHub history) | Note |
|---|---|---|---|---|---|
| 1 | `Android Love.mp3` | 3:01 | 2.8 MB | 2025-05-20 |  |
| 2 | `Cyber Silence (Extended) (2).mp3` | 3:42 | 3.4 MB | 2025-05-19 |  |
| 3 | `CyberLoom (Extended).mp3` | 3:27 | 3.2 MB | 2025-05-19 |  |
| 4 | `Eclipse.mp3` | 2:49 | 2.6 MB | 2025-05-19 |  |
| 5 | `Eternal Paradox.mp3` | 3:41 | 3.4 MB | 2025-05-19 |  |
| 6 | `Fuck the System  (2.0).mp3` | 2:21 | 2.2 MB | 2025-05-23 | strong language in the title |
| 7 | `Ghost 1.0.mp3` | 3:12 | 2.9 MB | 2025-05-21 |  |
| 8 | `Psychedelic Upgrade.mp3` | 3:20 | 3.1 MB | 2025-05-20 |  |
| 9 | `Pulse (Extended).mp3` | 3:26 | 3.2 MB | 2025-05-19 |  |
| 10 | `RetroVibe (Extended).mp3` | 3:51 | 3.5 MB | 2025-05-23 |  |
| 11 | `Upgrades (Extended Mix).mp3` | 2:56 | 2.7 MB | 2025-05-20 |  |
| 12 | `Vaporia.mp3` | 3:32 | 3.2 MB | 2025-05-23 |  |
| 13 | `Yearning Pulse 02 (Cover) (1).mp3` | 3:41 | 3.4 MB | 2025-05-19 | "(Cover)" label (David: Riffusion's name for his own remix) |
| 14 | `Это всё дерьмо 3.0.mp3` | 2:58 | 2.7 MB | 2025-05-23 | Russian profanity in the title |
| 15 | `谢谢你送来的猫咪.mp3` | 2:38 | 2.4 MB | 2025-05-23 |  |
| 16 | `Nexus DataCore (Cover).mp3` | 3:30 | 3.2 MB | 2025-05-23 | "(Cover)" label (David: Riffusion's name for his own remix) |
| 17 | `Meta Mist (2.0).mp3` | 3:32 | 3.2 MB | 2025-05-31 |  |
| 18 | `Sheep.mp3` | 3:28 | 3.2 MB | 2025-05-31 |  |
| 19 | `Nights in Chongqing 3.0.mp3` | 3:03 | 2.8 MB | 2025-05-31 |  |
| 20 | `MetaMist.mp3` | 3:42 | 3.4 MB | 2025-08-10 |  |
| 21 | `SexBot (Cover).mp3` | 3:16 | 3.0 MB | 2025-08-10 | sexual theme in the title; "(Cover)" label (David: Riffusion's name for his own remix) |
| 22 | `Sanctum of the Circuit.mp3` | 3:05 | 2.8 MB | 2025-06-06 |  |
| 23 | `The City (Cover)_1749857657755.mp3` | 3:21 | 3.1 MB | 2025-06-13 | "(Cover)" label (David: Riffusion's name for his own remix); upload timestamp in the name |
| 24 | `The City (Extended)_1749857657712.mp3` | 3:46 | 3.4 MB | 2025-06-13 | upload timestamp in the name |
| 25 | `Synthetic Touch.mp3` | 3:26 | 3.1 MB | 2025-08-10 |  |
| 26 | `Synthetic Touch (Her) (02) (Cover).mp3` | 3:37 | 3.3 MB | 2025-08-10 | romantic/sexual theme possible; lyrics not reviewed; "(Cover)" label (David: Riffusion's name for his own remix) |
| 27 | `BlackRock Leash (Cover)_1754669325561.mp3` | 3:15 | 3.0 MB | 2025-08-08 | "(Cover)" label (David: Riffusion's name for his own remix); upload timestamp in the name |

Total: 27 files, about 82 MB, all 128 kbps MP3 (re-encoded; the only tag in each file is `encoder: Lavf`, an ffmpeg tag).

- **Every one of the 27 songs was already in the repository between 19 May 2025 and 10 August 2025**, from GitHub's full commit history (this Claude clone is shallow, so its own history is not used). Three filenames also carry an upload timestamp: `...(Cover)_1749857657755` and `...(Extended)_1749857657712` are 13 June 2025, and `BlackRock Leash (Cover)_1754669325561` is 8 August 2025.
- **The receipt period (17 March to 17 April 2026) is later than all of them, by seven to ten months.** So the receipt shows David held a paid plan in March 2026. It **cannot** show what plan he was on when these songs were *made* (in or before May to August 2025). A song's creation date is at the latest its first-added date; it could be earlier.
- The audio files contain **no title, artist, copyright, creation-date or licence tags**. They do not prove their origin. (`Lavf` shows they were re-encoded by ffmpeg after download.)
- The filenames and the "(Cover)" labels match Riffusion's naming style, which is consistent with David's statement but is not proof.

## 3. What the platform's terms say: not verified
Claude Code could not open Riffusion's or Producer.ai's own terms pages from its session, and web searches returned only third-party summaries that **conflict with each other** (for example on price and plan names). Nothing below is a quotation of the official terms. Treat it as a list of **questions to settle**, not as findings.

Points the secondary sources agreed on:
- **Free-tier output is generally described as non-commercial** (personal or educational use).
- **Paid plans are generally described as granting a commercial *licence* to the output, not transfer of copyright ownership** of the service or of the output.
- **Subscribing after making a song is generally described as *not* retroactively granting commercial rights to songs made on the free tier.** One review says `riffusion.com/terms` now redirects to a Google-gated page (`flowmusic.app`), and one listing calls the service "Producer.ai by Google Labs", so the terms in force when the songs were made (2025) may differ from today's and are hard to read now.
- Nothing found addressed the **Cover** feature's output rights directly. A cover of a *third party's* song would need that owner's permission; a remix of **David's own** uploaded recording is a different matter. Which one each "(Cover)" is depends on what David uploaded.

Sources consulted (secondary, unofficial; **not** the terms themselves):
- https://clipjury.pages.dev/reviews/riffusion (a review that says free output was non-commercial and that the terms page redirects)
- https://jackrighteous.com/en-gb/blogs/ai-music-distribution-guide/free-vs-paid-ai-music-tools-what-rights-do-you-get (free versus paid rights; no retroactive grant)
- https://terms.law/FAQ/ai-tools/ai-commercial-use-faq.html
- https://toolradar.com/tools/producer-ai-by-google-labs/pricing
- https://sunowatermark.com/blog/riffusion-review-2026/

## 4. Verified versus unresolved
| Question | Status |
|---|---|
| David made the songs with Riffusion/Producer.ai | **David's statement.** Consistent with the file names; not independently provable from the files. |
| David paid for a Starter plan 17 March to 17 April 2026 | **David's statement of a receipt** (not seen by Claude Code). |
| The songs were made under a paid plan | **Settled (David, 2026-11-08):** he held a paid Riffusion subscription in 2025 when all 27 were created. The 2026 receipt is a later period. |
| Which plan David was on in 2025 | **A paid Riffusion subscription** (David's statement, 2026-11-08). The plan name on that 2025 receipt is not copied into this file. |
| Commercial rights for the songs | **Settled for the game's use**: made during a paid subscription, so the free-tier non-commercial limit does not apply. |
| The terms in force in 2025 (before the Google-era rebrand) | **Unverified**; the current terms page is gated. |
| "(Cover)" files are David's own remixes | **David's statement.** Treat as such. Keep the source files. |
| Ownership versus licence | Sources say licence. A licence to use may be all David holds, which is enough to *play* the songs but not to *sell or sublicense* them. |
| Is a free site and free game test "commercial"? | Not a legal conclusion we can give. The site also runs shops, so assume the commercial question matters. Not legal advice. |

A general caveat (secondary guidance, not legal advice): several legal guides say fully AI-generated audio may receive **no copyright protection of its own** under current US law, even where a platform lets the user use it commercially. A platform licence lets David *use* the songs; it may not stop others copying them. Songs David wrote, performed or substantially shaped himself (for example his own lyrics, or remixes of his own recordings through the Cover feature) have a stronger position, which is another reason to keep his source recordings and prompts. See [Promise Legal](https://blog.promise.legal/ai-generated-assets-game-ip-disclosure).

## 5. What to gather (David)
1. **Producer.ai / Riffusion account history:** every receipt or invoice, with dates, from 2025 to now, and the plan name on each.
2. **The song library page** for each of the 27 songs, showing its creation date (and, if shown, the plan or model) and, for the "(Cover)" ones, the source recording it was made from.
3. The **terms of service and the commercial-rights page as they stand today, saved with the date** (a PDF or screenshot), and, if possible, the version that applied in May to August 2025 (the site's own history, an archived copy, or an email from support).
4. A short **email to Riffusion/Producer.ai support**: "Do songs I generated in 2025 on [plan], and later remixed on [plan], carry commercial-use rights now that I have a paid Starter plan? Can I use them in a game I publish?" Keep the reply.
5. His **original source recordings** for the "(Cover)" songs (to show they are his own).
These items are optional records now. David has confirmed the rights are settled for the game's use (update, 2026-11-08).

## 6. Age policy (separate from rights)
Explicit language is **not** a reason to remove a song. It matters for the age policy David has not yet decided (PR #191). Titles that signal it: `Fuck the System (2.0)` (strong language), `Это всё дерьмо 3.0` (Russian profanity), `SexBot (Cover)` (sexual theme). Lyrics were **not** transcribed or reviewed. Record the decision with the age policy, not here.

## 7. How the game handles them
- **The audio files are the website's own files** in `attached_assets/`; nothing is copied or renamed, filenames and titles are unchanged, and the website's player keeps playing them exactly as before.
- **On 4 Nov 2026 the 3D game kept the website playlist OFF** (`WEBSITE_PLAYLIST=false`). **On `main` as of 12 Nov 2026 that flag is `true`**, so the pod player includes the 27 songs. "My music" is still available. This file does not change the flag.
- For a browser-only override while testing, `localStorage['darknet-pod-music-site']='1'` or `?sitemusic=1` still forces the site list on when the flag is off. With the flag already true, those overrides are unused.
- The 27 names and paths are listed in `void-runner/pod-music.js` (`SITE`) and in the table above.
- Unchanged and out of scope here: the files are **already publicly downloadable** from the live site at `/attached_assets/<name>.mp3` because they are tracked in the public repository. Taking them off the public site would be a separate repository change (not made).
- A copyright-free alternative that needs no licence decision exists: the three generative synth tracks in the Tesana Sleeping Pod ZIP (`TESANA_ASSET_AUDIT.md`, item H6); not imported.
