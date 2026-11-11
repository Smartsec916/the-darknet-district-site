# AGENTS.md

Instructions for coding agents live in `CLAUDE.md`. **For the current work, read `docs/development/AI_HANDOFF.md` and `docs/development/AI_ROADMAP.md` first**, then `CLAUDE.md` and the historical `VOID_RUNNER_HANDOFF.md`. November 2026 District-first decisions supersede the October Vesper/tutorial-first plan.

**Release safety:** Draft integration PR #212 must not be merged wholesale solely because CI is green; validate actual desktop/handheld/mobile entry, character creator, Sleeping Pods, accounts/saves, and production API compatibility. The owner is willing to publish independently ready fixes, not unverified integrations. Only unfinished **in-game** shop items may be cleared as needed; real website merchandise, customer entitlements and payment systems remain untouched.

Voice work: follow `docs/VOID_RUNNER_VOICE_PRODUCTION.md`. Approved voices in `tools/audio/npc-voice-registry.json` are locked; never change them, the model files, or the reserved special-character slot without David's approval.
