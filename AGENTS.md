# AGENTS.md

Instructions for coding agents live in `CLAUDE.md`. **For the current work, read the Start here section of `docs/development/AI_HANDOFF.md`, then `docs/development/AI_ROADMAP.md`**, then `CLAUDE.md` and the historical `VOID_RUNNER_HANDOFF.md`. November 2026 District-first decisions supersede the October Vesper/tutorial-first plan. Older handoffs (`CODEX_HANDOFF.md`, `CODEX_TO_CLAUDE_HANDOFF_2026-11-06.md`) are snapshots. Do not start work from them.

**Release safety:** PR #212 merged on 11 Nov 2026. Do not revive it as the integration branch. Merge to `main` only when David says "push", "pull it", or "go ahead and pull". The game is desktop and VR headsets only, not phones. Leave the Sleeping Pod room and the music player alone unless he asks. Validate character creator, Sleeping Pods, accounts/saves, and production API compatibility before a production change. Only unfinished **in-game** shop items may be cleared as needed; real website merchandise, customer entitlements and payment systems remain untouched. Licensed models stay in `Smartsec916/void-runner-licensed-assets` and are sealed at the Pages build. Never commit them to this repo.

Voice work: follow `docs/VOID_RUNNER_VOICE_PRODUCTION.md`. Approved voices in `tools/audio/npc-voice-registry.json` are locked; never change them, the model files, or the reserved special-character slot without David's approval.

**Art direction (permanent, Nov 2026):** the 3D game is PC-only and targets AAA dark cyberpunk. Before any graphics, environment, Blender or asset work, read the "PERMANENT DIRECTION" section of `docs/VOID_RUNNER_ART_DIRECTION.md`. It supersedes older graphics guidance.
