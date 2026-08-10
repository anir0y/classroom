#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
build_dir="$(mktemp -d)"
trap 'rm -rf "$build_dir"' EXIT

cd "$repo_root"
hugo --minify --destination "$build_dir" >/dev/null

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

assert_file() {
  local file="$1"
  [[ -f "$file" ]] || fail "missing $file"
}

assert_contains() {
  local file="$1"
  local text="$2"
  grep -Fq "$text" "$file" || fail "missing '$text' in $file"
}

assert_json() {
  local file="$1"
  python3 -m json.tool "$file" >/dev/null || fail "invalid JSON in $file"
}

headers_file="$build_dir/_headers"
homepage="$build_dir/index.html"

assert_file "$headers_file"
assert_contains "$headers_file" 'Link: </.well-known/api-catalog>; rel="api-catalog"'

assert_file "$build_dir/.well-known/api-catalog"
assert_json "$build_dir/.well-known/api-catalog"
assert_contains "$headers_file" '/.well-known/api-catalog'
assert_contains "$headers_file" 'Content-Type: application/linkset+json'

agent_card="$build_dir/.well-known/agent-card.json"
assert_file "$agent_card"
assert_json "$agent_card"
assert_contains "$headers_file" '/.well-known/agent-card.json'
assert_contains "$headers_file" 'Content-Type: application/a2a+json'

python3 - "$agent_card" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    card = json.load(handle)

required = {
    "name",
    "description",
    "version",
    "capabilities",
    "supportedInterfaces",
    "defaultInputModes",
    "defaultOutputModes",
    "skills",
}
missing = sorted(required - card.keys())
if missing:
    raise SystemExit(f"missing Agent Card fields: {', '.join(missing)}")

for field in ("name", "description", "version"):
    assert isinstance(card[field], str) and card[field].strip(), (
        f"Agent Card {field} must be a non-empty string"
    )

assert card["capabilities"] == {
    "streaming": False,
    "pushNotifications": False,
    "extendedAgentCard": False,
}, "Agent Card capabilities must match the implemented Worker"
expected_modes = {"text/plain", "application/json"}
assert set(card["defaultInputModes"]) == expected_modes, (
    "Agent Card defaultInputModes do not match the Worker"
)
assert set(card["defaultOutputModes"]) == expected_modes, (
    "Agent Card defaultOutputModes do not match the Worker"
)
assert isinstance(card["supportedInterfaces"], list) and card["supportedInterfaces"], (
    "Agent Card supportedInterfaces must be a non-empty list"
)
interface = card["supportedInterfaces"][0]
assert interface == {
    "url": "https://classroom.anir0y.in/a2a",
    "protocolBinding": "JSONRPC",
    "protocolVersion": "1.0",
}

assert isinstance(card["skills"], list) and card["skills"], (
    "Agent Card skills must be a non-empty list"
)
for skill in card["skills"]:
    for field in ("id", "name", "description"):
        assert isinstance(skill.get(field), str) and skill[field].strip(), (
            f"Agent Card skill {field} must be a non-empty string"
        )
    assert isinstance(skill.get("tags"), list) and all(
        isinstance(tag, str) and tag.strip() for tag in skill["tags"]
    ), f"Agent Card skill {skill['id']} must have non-empty tags"
    assert set(skill.get("inputModes", [])) == expected_modes, (
        f"Agent Card skill {skill['id']} inputModes do not match the Worker"
    )
    assert set(skill.get("outputModes", [])) == expected_modes, (
        f"Agent Card skill {skill['id']} outputModes do not match the Worker"
    )

skill_ids = {skill["id"] for skill in card["skills"]}
assert skill_ids == {
    "search-classroom-content",
    "list-recent-classroom-posts",
}
PY

assert_file "$build_dir/.well-known/openapi.json"
assert_json "$build_dir/.well-known/openapi.json"

assert_file "$build_dir/.well-known/oauth-authorization-server"
assert_json "$build_dir/.well-known/oauth-authorization-server"

assert_file "$build_dir/.well-known/oauth-protected-resource"
assert_json "$build_dir/.well-known/oauth-protected-resource"

assert_file "$build_dir/auth.md"
assert_contains "$build_dir/auth.md" '# auth.md'

assert_file "$build_dir/.well-known/mcp/server-card.json"
assert_json "$build_dir/.well-known/mcp/server-card.json"

assert_file "$build_dir/.well-known/agent-skills/index.json"
assert_json "$build_dir/.well-known/agent-skills/index.json"
assert_file "$build_dir/.well-known/agent-skills/site-navigation/SKILL.md"
expected_digest="sha256:$(shasum -a 256 "$build_dir/.well-known/agent-skills/site-navigation/SKILL.md" | awk '{print $1}')"
assert_contains "$build_dir/.well-known/agent-skills/index.json" "$expected_digest"

assert_file "$homepage"
assert_contains "$homepage" 'js/webmcp.js'
assert_file "$build_dir/js/webmcp.js"
assert_contains "$build_dir/js/webmcp.js" 'navigator.modelContext'
assert_contains "$build_dir/js/webmcp.js" 'registerTool'
assert_contains "$build_dir/js/webmcp.js" 'provideContext'

echo "Agent discovery validation passed"
