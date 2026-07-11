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
