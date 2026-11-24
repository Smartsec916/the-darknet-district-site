# NPC importer and Companion Studio transfers

Issue #520 and PR #521 extend Developer Tools → NPCs → Import Model. The editor accepts a GLB, a self-contained glTF or a Companion Studio transfer containing one GLB. It keeps imported files in IndexedDB and uses the existing NPC import size and self-contained model checks. It reports static models and lets developers try compatible transfer motions through the existing retargeting preview.

## Developer workflow

1. Import the package. Show the character in 3D to run the model checklist and try available animations.
2. Open the personality editor to paste or edit Studio JSON. The preview and transfer use the current dialogue pools. Recordings for unchanged dialogue stay attached.
3. Choose an ElevenLabs voice ID and preview the Eleven v4 batch. The preview is local. Generation requires a developer session and confirmation. It saves each successful line before continuing, so a retry queues only dialogue without a recording.
4. Set a test placement to see the model in a throwaway play session. Download the integration package after completing the licence checklist. The updated companion transfer carries the model, motion files and active recordings.
5. To use the personality and audio with an existing made world NPC, copy the profile into the mission draft, then test the existing NPC and use **Publish & versions**. The action preserves the target NPC's identity, model, placement and matching draft recordings. Registering a new model still uses the normal licensed asset integration process.

## Validation and follow-up

- Run `node tools/admin-inventory.cjs` after editing indexed game source. The inventory test checks the generated file for deterministic drift.
- The importer is a private draft tool. Keep owner transfers and licensed binaries out of Git. Generic story NPCs keep their authored dialogue and use their existing Conversations & Interactions or Lines & voice tools.
- Generated voice playback and publishing use the existing authenticated and content-addressed APIs. The PR was tested with fixture audio and a mocked developer generation endpoint. Testing used zero paid ElevenLabs credits.
