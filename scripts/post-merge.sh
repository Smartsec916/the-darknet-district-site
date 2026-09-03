#!/usr/bin/env bash
set -euo pipefail

# This project is a static site; post-merge setup has no install or migration step.
printf '%s\n' 'Post-merge setup complete: no dependency or migration work required.'