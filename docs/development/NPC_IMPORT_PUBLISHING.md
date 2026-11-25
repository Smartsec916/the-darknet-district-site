# Publishing an imported NPC

In Developer Tools, open NPCs and select the imported model. Run the preview checklist, fill in the source and licence, and choose a spot or route on The Avenue. Select **Publish NPC to game** and confirm the placement. The editor shows the live content version once the server accepts it.

For a new model, open a terminal in this repository on your Windows PC and run:

    node tools/npc-publisher.cjs

Use the GitHub CLI account that can write to the private licensed-assets repository and run the site's Pages workflow. Enter the terminal's pairing code in the editor and allow the browser's local network prompt. Keep the editor open while Pages builds. Previously registered model bytes skip this step. Close the terminal after registration.

If Pages is delayed, check the Deploy site workflow and retry Publish after it finishes. Model registration alone does not place the NPC. Use Developer Tools publishing history to roll back a world change. Download Backup remains available for local transfers.
