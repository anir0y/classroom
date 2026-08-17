#!/bin/bash
# Capture exactly ONE browser window, selected by a required title substring.
#
# Why this shape:
#   - Chrome is not scriptable from this shell (AppleScript reports 0 windows),
#     so window bounds/tab URLs are unavailable that way.
#   - screencapture -R (region) would grab whatever happens to be on screen in
#     that rect. That is how a private chat window leaked once. Never use it.
#   - screencapture -l<windowid> captures the window's own contents, so an
#     overlapping window physically cannot appear in the output.
#
# The title is the guard: a Chrome window's title tracks its ACTIVE tab, so
# requiring the title to match means the intended page is the one in front.
# Refuses unless exactly one window matches.
#
# Usage: win_shot.sh <out.png> <required-title-substring>
set -u
OUT="$1"; WANT="$2"
HERE="$(cd "$(dirname "$0")" && pwd)"
MATCH=$(swift "$HERE/wl.swift" 2>/dev/null | grep -F "$WANT")
N=$(printf '%s\n' "$MATCH" | grep -c .)
if [ "$N" -ne 1 ]; then
  echo "REFUSED: $N windows match '$WANT' — not capturing."; printf '%s\n' "$MATCH"; exit 1
fi
WID=$(printf '%s' "$MATCH" | cut -f1)
TITLE=$(printf '%s' "$MATCH" | cut -f2-)
mkdir -p "$(dirname "$OUT")"
screencapture -x -o -l"$WID" "$OUT" || { echo "capture failed"; exit 1; }
[ -s "$OUT" ] || { echo "REFUSED: empty capture"; rm -f "$OUT"; exit 1; }
echo "saved $OUT  (wid=$WID title='$TITLE')"
