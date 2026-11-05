# AGENTS.md

Instructions for coding agents live in `CLAUDE.md`. At the start of every session, fetch GitHub, verify the pushed development HEAD, and read `docs/development/AI_HANDOFF.md` and `docs/development/AI_ROADMAP.md` alongside `CLAUDE.md` and `VOID_RUNNER_HANDOFF.md`. The AI handoff names the active integration branch; never silently begin from `main` or an outdated checkout.

Voice work: follow `docs/VOID_RUNNER_VOICE_PRODUCTION.md`. Approved voices in `tools/audio/npc-voice-registry.json` are locked; never change them, the model files, or the reserved special-character slot without David's approval.
