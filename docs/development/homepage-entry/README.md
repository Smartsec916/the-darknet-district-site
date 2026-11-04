# Homepage title entry (prepared, inactive)

The current homepage stays unchanged during the unlisted game test. The prepared patch wraps the existing **THE DARKNET DISTRICT** title in one accessible link and adds a small **ENTER** label at its upper-left edge. The title's typography, color, effects and surrounding teaser stay in place. On a phone, the link leads to the existing Arcade page instead of opening the 3D game; the game's own device gate remains the final safeguard. The link has a visible keyboard focus outline.

Check without changing the homepage: `git apply --check docs/development/homepage-entry/activate-homepage-entry.patch`.

After David approves public activation, apply the patch in a separate branch and PR, run the site and browser checks, then review the resulting page before merging. Do not apply it during the first unlisted test. Roll back an unmerged patch with `git apply -R docs/development/homepage-entry/activate-homepage-entry.patch`; after publication, revert the activation commit.
