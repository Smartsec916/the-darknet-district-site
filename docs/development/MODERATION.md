# District chat: moderation and handling path (early access)

Written 2026-11-06. Nothing here is live until David approves the Render and publishing steps in `HUB_RENDER_SETTINGS.md`.

## What players can do

- **Mute** (hides one player's chat) and **Block** (also hides their character) from the PLAYERS panel, or `/mute NAME`, `/unmute NAME`, `/block NAME`, `/unblock NAME` in the chat box. Kept on that player's device for that account. The hub also stops delivering a muted or blocked player's chat to them. A blocked player stays listed under PLAYERS (marked "not in view") so they can be unblocked.
- **Report** (PLAYERS > REPORT): reason (harassment, spam, inappropriate, cheating, other) and an optional note of up to 120 characters. One report per 20 seconds, 5 per session.

## What the hub enforces (server side, in `tools/district-hub/chat.cjs` and `protocol.cjs`)

Only a verified, registered (non-anonymous) account can chat; the displayed name is the account's public handle chosen by the hub, never by the message. Text is cleaned (invisible and direction-changing characters, control characters removed), at most 200 characters, no links, no long repeated characters, shown as plain text only. At most 5 lines per 10 seconds and one per 0.7 s; the same line twice within 15 seconds is refused; 5 refusals in a row pause that player's chat for 60 seconds. Chat is room-wide in the District interior (room cap 12). No chat history is stored: only the last 40 lines are kept in memory for reports and are lost on restart.

## What happens to a report

Each report becomes one line in the **hub's Render log**, starting `REPORT `, followed by JSON: time, room, reason, note, the reporter (public id, account id, handle), the reported player (public id, **account id**, handle) and the reported player's last up to 10 chat lines. No sign-in token is ever logged. Render keeps service logs only for a limited time (check the dashboard; do not rely on them as an archive).

## Owner's handling path (all manual, no new service, no cost)

1. Render dashboard > `district-hub` > **Logs**, search `REPORT`. Judge the lines.
2. To remove someone: copy the reported player's account id (`target.uid`) into the hub's `HUB_DENY_UIDS` (comma separated) and save. Render restarts the service (a few seconds to a minute) and that account is refused from then on, even if it is registered. No redeploy of code is needed. To undo, remove the id.
3. To stop everything at once: Render > `district-hub` > **Suspend**. The game then plays solo everywhere; nothing is lost.
4. Firebase Console > Authentication > Users can disable the account itself (the hub already stops accepting new sign-ins from a disabled account once its token expires, up to an hour; the deny-list is immediate).

## Known gaps (be honest with players)

- No automatic profanity filter, no chat history for moderators beyond the 10 lines in a report, no appeal tooling, no per-player rate of reports. Reports are only as good as someone reading the log.
- A banned person can register a new account. Options if that becomes a problem: set `HUB_REQUIRE_VERIFIED_EMAIL=true` (needs verified email addresses; check the site's sign-up first), Firebase App Check, or go back to the allow-list.
- The game has no published terms of use or privacy notice that mentions chat. Reports and chat lines contain account ids; the owner should decide what the site says before opening to the public (not legal advice).
- Under-13 and similar rules for online chat: the site's audience and age policy should be decided by the owner before public chat.
