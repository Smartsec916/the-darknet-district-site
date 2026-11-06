#!/bin/sh
# Starts the local preview of The Darknet District (nothing is published or uploaded).
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null 2>&1 || { echo "Node.js is needed for the preview. Install the LTS version from https://nodejs.org"; exit 1; }
( sleep 1; (xdg-open http://127.0.0.1:5187/void-runner.html || open http://127.0.0.1:5187/void-runner.html) >/dev/null 2>&1 ) &
exec node tools/preview-server.cjs "$@"
