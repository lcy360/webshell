#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [[ ! -x "$CHROME" ]]; then
  echo "Google Chrome not found at $CHROME" >&2
  exit 1
fi

find "$ROOT/marketing/xiaohongshu/campaign/images" -name '*.svg' -print0 | while IFS= read -r -d '' svg; do
  png="${svg%.svg}.png"
  "$CHROME" --headless --disable-gpu --screenshot="$png" --window-size=1080,1440 "file://$svg" >/dev/null 2>&1
done

echo "Rendered campaign PNG images."
