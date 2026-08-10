# Classroom A2A Worker Design

Date: 2026-08-10
Status: Approved direction; pending implementation-plan review

## Goal

Publish an A2A 1.0 Agent Card at /.well-known/agent-card.json and a real,
read-only A2A endpoint at /a2a. The endpoint must automatically reflect new
blog posts after the existing Hugo/GitHub Pages deployment updates /index.json.

## Scope

The change adds an isolated TypeScript Cloudflare Worker plus a static Agent
Card mirror for the existing Hugo build. It does not replace GitHub Pages,
change the blog UI, add an AI model, add authentication, or deploy anything.

The Worker handles only these Cloudflare routes:

- https://classroom.anir0y.in/.well-known/agent-card.json*
- https://classroom.anir0y.in/a2a*

All other requests continue to the existing GitHub Pages origin.

## Agent Card

The card follows the A2A 1.0 required shape and advertises:

- Name: Classroom Content Agent
- Version: 1.0.0
- Preferred interface: https://classroom.anir0y.in/a2a
- Protocol binding: JSONRPC
- Protocol version: 1.0
- Capabilities: no streaming, push notifications, or extended card
- Default input modes: text/plain, application/json
- Default output modes: text/plain, application/json
- Skills:
  - search-classroom-content
  - list-recent-classroom-posts

JSON-RPC is preferred over HTTP+JSON because it is directly callable by A2A
SDK clients. No provider organization or security scheme is declared because
the public site is unauthenticated and no organizational identity should be
invented.

## Request Contract

The endpoint accepts A2A JSON-RPC 2.0 SendMessage requests. It returns an
immediate A2A Message, so no task storage or Durable Object is required.

Inputs are interpreted deterministically:

- A structured data part may request action search with query and limit.
- A structured data part may request action recent with a limit.
- Text beginning with search: searches for the remaining text.
- Text asking for recent/latest posts lists recent entries.
- Other non-empty text is treated as a search query.

Limits are clamped to 1-10, matching the existing WebMCP tools. Search is
case-insensitive across the index title, summary, content, and permalink.

The response includes a human-readable text part and a structured data part
containing canonical post titles, URLs, and summaries.

Only SendMessage is supported. Unknown JSON-RPC methods return -32601.
Malformed JSON and invalid requests return the standard JSON-RPC errors
-32700, -32600, or -32602 as appropriate.

## Automatic Blog Updates

The Worker reads https://classroom.anir0y.in/index.json at request time. It
does not embed posts at build or deploy time. Therefore the normal Hugo publish
flow remains the single content update mechanism.

The index is cached at the Worker edge for at most 60 seconds to avoid repeated
origin traffic. A longer-lived last-known-good cache is retained and used only
when the origin fetch fails or returns malformed data. Origin failures are
logged and surfaced as retriable JSON-RPC internal errors if no cached index is
available; they are never silently converted to empty results.

Observable update guarantee: after /index.json reflects a newly deployed post,
A2A results reflect it within 60 seconds under normal operation.

## Project Layout

The Worker lives in an isolated cloudflare/a2a-worker/ package with its own
Wrangler configuration, TypeScript configuration, package manifest, lockfile,
source, and tests. The Hugo repository remains otherwise unchanged.

static/.well-known/agent-card.json is the Agent Card source used by the Hugo
fallback and imported into the Worker bundle, preventing the static and Worker
responses from drifting.

The existing scripts/validate_agent_discovery.sh will be extended to assert
that the Hugo build contains a valid Agent Card with the required interface,
capabilities, and skills.

## Verification

Implementation follows a red-green loop:

1. Extend the Hugo discovery validation and confirm it fails because the card
   is missing.
2. Add Worker unit tests for card serving, A2A request validation, search,
   recent-post listing, live-index refresh, cache behavior, and origin failure.
3. Implement only enough code to make those tests pass.
4. Run the Worker tests, TypeScript checking, the Hugo discovery validator,
   and hugo --minify.

Deployment is a separate approval-gated step. Before deploying, verify that
classroom.anir0y.in is orange-cloud proxied, confirm the anir0y.in zone and
Worker target, back up any .env files if present, and inspect the Wrangler
routes. After deployment, verify the Agent Card, a real SendMessage request,
normal blog pages, and the existing unauthenticated access behavior end to end.

## References

- A2A 1.0 specification: https://a2a-protocol.org/latest/specification/
- A2A discovery: https://a2a-protocol.org/latest/topics/agent-discovery/
- Cloudflare Worker routes: https://developers.cloudflare.com/workers/configuration/routing/routes/
