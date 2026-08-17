#!/bin/bash
# Run a command in iTerm, wait for output to settle, then capture ONLY the iTerm window.
# Refuses to capture unless iTerm is frontmost — blind region capture has leaked
# unrelated windows before, so this guard is mandatory.
#
#   scripts/thm/iterm_shot.sh 01-name 'command' [timeout_seconds]
cd "$(dirname "$0")"
NAME="$1"; CMD="$2"; TMO="${3:-200}"
WID=$(cat .iterm_wid 2>/dev/null) || { echo "no .iterm_wid"; exit 1; }
OUT="${SHOT_DIR:-shots}"; mkdir -p "$OUT"

osa(){ /usr/bin/osascript -e "$1"; }
grab(){ osa "tell application \"iTerm\" to get contents of session 1 of tab 1 of window id $WID"; }

ESC=$(printf '%s' "$CMD" | sed 's/\\/\\\\/g; s/"/\\"/g')
osa "tell application \"iTerm\" to tell session 1 of tab 1 of window id $WID to write text \"clear; $ESC\"" >/dev/null
sleep 4

# settle detection: screen unchanged twice in a row and last line is a shell prompt.
# avoids printing a marker line into the screenshot.
prev=""; stable=0; deadline=$(( $(date +%s) + TMO ))
while [ "$(date +%s)" -lt "$deadline" ]; do
  cur="$(grab | sed 's/[[:space:]]*$//' | sed '/^$/d')"
  last="$(printf '%s' "$cur" | tail -1)"
  if [ "$cur" = "$prev" ] && printf '%s' "$last" | grep -qE '(#|\$|❯|%)[[:space:]]*$'; then
    stable=$((stable+1)); [ $stable -ge 2 ] && break
  else stable=0; fi
  prev="$cur"; sleep 3
done

osa "tell application \"iTerm\" to activate" >/dev/null 2>&1
osa 'tell application "System Events" to set frontmost of process "iTerm2" to true' >/dev/null 2>&1
osa "tell application \"iTerm\" to select window id $WID" >/dev/null 2>&1
sleep 2

FRONT=$(osa 'tell application "System Events" to get name of first application process whose frontmost is true' 2>/dev/null)
if [ "$FRONT" != "iTerm2" ] && [ "$FRONT" != "iTerm" ]; then
  echo "REFUSED: frontmost is '$FRONT', not iTerm — not capturing."; exit 1
fi

B=$(osa "tell application \"iTerm\" to get bounds of window id $WID")
X1=$(echo "$B"|cut -d, -f1|tr -d ' '); Y1=$(echo "$B"|cut -d, -f2|tr -d ' ')
X2=$(echo "$B"|cut -d, -f3|tr -d ' '); Y2=$(echo "$B"|cut -d, -f4|tr -d ' ')
screencapture -x -o -R"${X1},${Y1},$((X2-X1)),$((Y2-Y1))" "$OUT/${NAME}.png"
echo "saved $OUT/${NAME}.png"
