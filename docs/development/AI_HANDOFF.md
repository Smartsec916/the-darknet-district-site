# Claude Code ↔ Codex handoff

**Active integration branch:** `codex/conversations-character-foundation`. GitHub HEAD was verified as `837affa17ab980e2a1884173efe220d4d39ef4fe` on 2026-11-05, before this documentation update. The branch's **current** head is always the result of `git ls-remote origin refs/heads/codex/conversations-character-foundation`; do not treat this snapshot hash as a permanent tip. This branch is unmerged and unpublished. No draft PR exists because `api.github.com/graphql` returned `Forbidden`.

## Start every session

1. Read `AGENTS.md`, `CLAUDE.md`, this file, and `AI_ROADMAP.md`. For canon and older decisions, follow `VOID_RUNNER_HANDOFF.md` and `CODEX_HANDOFF.md`; their older branch/start descriptions are historical.
2. `git fetch origin --prune`; check `git status --short --branch`, `git rev-parse HEAD`, and `git ls-remote origin refs/heads/codex/conversations-character-foundation`. Confirm the local checkout contains the remote tip before editing. If the branch has moved, fetch and inspect its commits; if work is dirty or histories diverge, preserve both and reconcile explicitly. Never silently use `main`, force-push, reset, or overwrite the other AI's unmerged commits.
3. Keep this as the sole active integration branch until the owner directs a change. Use a separate feature branch from its verified tip when isolation helps; integrate it back only after review. Do not merge to `main`, deploy, alter production systems, delete saves, or buy services without the owner's approval.
4. Before ending: run tests relevant to the edit, update this handoff with exact completed/pending work and the next task, commit, push the development branch, and verify its remote head. Report any push or draft-PR failure plainly. Record the last **feature** commit here; use the remote-head command for the latest documentation commit, avoiding a self-referential hash.

## Current development state

- **Playable foundation:** New and returning desktop campaigns wake in Sleeping Pod 01; Exit Pod enters the District. Old tutorial/cargo/story mission triggers are closed while definitions, editor content, saves, credits, ships, and historical progress remain. The earlier Tesana-inspired pod 01 panels, CC0 texture maps, hosted playlist, browser-local personal music, spectrum, and lights remain. Other nine pods and protected world geometry are untouched.
- **Site/test gate:** The unlisted desktop route and phone gate remain; phones load the regular site, not the game. Website Sleeping Pod Iris was removed, in-game Iris remains separate from the site chatbot, obsolete Share Links are removed, and the homepage ENTER patch remains unpublished.
- **Social:** Player/NPC cards share one visible design. The common walking `talk()` path, including VR companion calls, uses a floating, minimizable message panel; movement and camera continue. Local NPC history is scoped by account UID or guest browser and filtered in Social. It is not player messaging or cross-device history.
- **Character and achievements:** A server-authorized create-once endpoint stores one character choice in the existing account record without changing saves. Two existing District crowd looks have baked hair/clothing; the player model is not rendered in-world. Admin can reserve the Admin look in that same slot, but cannot yet play as Admin. Achievement categories, public-display ordering, progress previews, and an administrator-only **read-only** catalog exist; no authoritative unlock/edit/grant service exists.

Latest feature commits on this branch: `dbab0e5` (archived mission guards), `a1d1e10` (conversations and characters), `837affa` (NPC read state). See `CONVERSATION_CHARACTER_MILESTONE.md`, `SOCIAL_FOUNDATION.md`, and `TESANA_ASSET_AUDIT.md` for detail; do not duplicate their audits here.

## Verification and limits

Last development run (2026-11-05): Node **609 passed, 1 skipped**; Python API/save **36 passed**; local Chromium low/high conversation checks passed movement, mouse look, minimize/restore, Social filters and no page errors; device gate **9/9** passed with emulated devices. Browser graphics used software GL. No physical GPU/ROG Ally, real account API, full VR companion playthrough, long-distance conversation, or two-client multiplayer test has passed.

Known gaps: archived Vesper tutorial has two direct blocking `panel()` dialogue branches; online player messaging and moderation are absent; the selected character has no in-world body or verified swappable hair/clothes; playable Admin/Iris handoff and shared-room synchronization do not exist; Achievement Manager is read-only; the Tesana pod reconstruction is partial. No new Tesana models were imported because animation compatibility and/or rights are unresolved. The current branch is **not deployment-ready**.

**Next recommended task:** finish the non-blocking conversation path, including the two archived direct-panel exceptions, then exercise a real VR companion conversation and moving-away case in local low/high browser runs. Keep VR physical assets and behavior unchanged. After that, validate account-bound character creation against a nonproduction API and plan the first two-client social test. Follow `AI_ROADMAP.md` for scope and approval boundaries.
