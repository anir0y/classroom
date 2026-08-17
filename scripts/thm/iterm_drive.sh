#!/bin/bash
# Run a command in a live iTerm session and return its output.
# Targets the session by window id (stored in .iterm_wid next to this script),
# because "current window" breaks as soon as focus moves.
#
#   echo <window-id> > scripts/thm/.iterm_wid
#   scripts/thm/iterm_drive.sh 'whoami' [timeout_seconds]
cd "$(dirname "$0")"
CMD="$1"; TMO="${2:-180}"
MARK="ZZEND$RANDOM"
WID=$(cat .iterm_wid 2>/dev/null) || { echo "no .iterm_wid"; exit 1; }

osa() { /usr/bin/osascript -e "$1"; }
grab() { osa "tell application \"iTerm\" to get contents of session 1 of tab 1 of window id $WID"; }

ESC=$(printf '%s' "$CMD" | sed 's/\\/\\\\/g; s/"/\\"/g')
osa "tell application \"iTerm\" to tell session 1 of tab 1 of window id $WID to write text \"clear; { $ESC ; } 2>&1 | tail -n 150; echo $MARK\"" >/dev/null

deadline=$(( $(date +%s) + TMO ))
while [ "$(date +%s)" -lt "$deadline" ]; do
  out="$(grab)"
  # trailing whitespace on iTerm lines: match with [[:space:]]*$
  if printf '%s' "$out" | grep -qE "^$MARK[[:space:]]*$"; then
    printf '%s' "$out" | sed -n "/^$MARK[[:space:]]*\$/q;p" \
      | grep -v "clear; {" | sed 's/[[:space:]]*$//' | sed '/^$/d'
    exit 0
  fi
  sleep 4
done
echo "[drive] TIMEOUT ${TMO}s; screen tail:"; grab | tail -n 40
