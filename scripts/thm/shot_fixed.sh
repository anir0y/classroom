#!/bin/bash
# Capture one iTerm window after a FIXED wait. Same frontmost + bounds guard as iterm_shot.sh.
cd "$(dirname "$0")"
NAME="$1"; CMD="$2"; WAIT="${3:-180}"
WID=$(cat .iterm_wid) || exit 1
OUT="${SHOT_DIR:-shots}"; mkdir -p "$OUT"
osa(){ /usr/bin/osascript -e "$1"; }
ESC=$(printf '%s' "$CMD" | sed 's/\\/\\\\/g; s/"/\\"/g')
osa "tell application \"iTerm\" to tell session 1 of tab 1 of window id $WID to write text \"clear; $ESC\"" >/dev/null
sleep "$WAIT"
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
