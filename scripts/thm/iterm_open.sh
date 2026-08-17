#!/bin/bash
# Open a sized iTerm window for THM work and record its id for the other helpers.
#   scripts/thm/iterm_open.sh ['optional command to run, e.g. ssh -i key root@10.x.x.x']
cd "$(dirname "$0")"
INIT="${1:-clear}"
WID=$(/usr/bin/osascript <<APPLE
tell application "iTerm"
  activate
  set w to (create window with default profile)
  tell current session of w to write text "$INIT"
  return id of w
end tell
APPLE
)
echo "$WID" > .iterm_wid
# 1400x640 keeps screenshots tight and legible for the blog
/usr/bin/osascript -e "tell application \"iTerm\" to set bounds of window id $WID to {60, 60, 1460, 700}" >/dev/null
echo "iTerm window $WID ready (id saved to $(pwd)/.iterm_wid)"
