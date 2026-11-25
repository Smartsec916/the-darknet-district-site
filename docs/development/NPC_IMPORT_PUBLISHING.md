# Publishing an imported NPC

In Developer Tools, open NPCs and select the imported model. Run the preview checklist, fill in the source and licence, and choose a spot or route on The Avenue. Select **Publish NPC to game** and confirm the placement. The editor shows the live content version once the server accepts it.

On Windows, run the following once in PowerShell from this repository. It registers the **Open PC Publisher** button for your Windows account.

    .\tools\install-npc-publisher.ps1

When a new model needs registration, select **Open PC Publisher** in the pairing dialog and accept the browser's request to open it. If the publisher is already open, use the code in its window. For a manual start, run:

    node tools/npc-publisher.cjs

Use the GitHub CLI account that can write to the private licensed-assets repository and run the site's Pages workflow. Enter the terminal's pairing code in the editor and allow the browser's local network prompt. Keep the editor open while Pages builds. Previously registered model bytes skip this step. Close the terminal after registration.

If Pages is delayed, check the Deploy site workflow and retry Publish after it finishes. Model registration alone does not place the NPC. Use Developer Tools publishing history to roll back a world change. Download Backup remains available for local transfers.
