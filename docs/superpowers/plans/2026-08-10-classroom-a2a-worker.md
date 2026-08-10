# Classroom A2A Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Add a callable A2A 1.0 JSON-RPC Worker whose search and recent-post results automatically follow the live Hugo index.

**Architecture:** A narrowly routed, stateless Cloudflare Worker serves the Agent Card and handles SendMessage at /a2a while GitHub Pages continues to serve the blog. Pure request/search logic is separated from the live index loader; the loader uses 60-second fresh and one-day last-known-good Cache API entries.

**Tech Stack:** TypeScript 7, Cloudflare Workers/Wrangler 4, Vitest 4, pnpm 11, Hugo, Bash/Python discovery validation.

---

### Task 1: Establish the failing Hugo discovery gate

**Files:**
- Modify: scripts/validate_agent_discovery.sh
- Modify: static/_headers

- [ ] **Step 1: Add Agent Card assertions before creating the card**

Add these assertions after the API catalog checks:

~~~bash
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

interface = card["supportedInterfaces"][0]
assert interface == {
    "url": "https://classroom.anir0y.in/a2a",
    "protocolBinding": "JSONRPC",
    "protocolVersion": "1.0",
}

skill_ids = {skill["id"] for skill in card["skills"]}
assert skill_ids == {
    "search-classroom-content",
    "list-recent-classroom-posts",
}
PY
~~~

Add this header rule:

~~~text
/.well-known/agent-card.json
  Content-Type: application/a2a+json; charset=utf-8
  Cache-Control: public, max-age=300
~~~

- [ ] **Step 2: Run the discovery validator and verify RED**

Run:

~~~bash
./scripts/validate_agent_discovery.sh
~~~

Expected: FAIL with a missing .well-known/agent-card.json message.

### Task 2: Add the Agent Card and isolated Worker package

**Files:**
- Create: static/.well-known/agent-card.json
- Create: cloudflare/a2a-worker/package.json
- Create: cloudflare/a2a-worker/tsconfig.json
- Create: cloudflare/a2a-worker/wrangler.jsonc
- Create: cloudflare/a2a-worker/pnpm-lock.yaml (generated)

- [ ] **Step 1: Create the A2A 1.0 Agent Card**

Create static/.well-known/agent-card.json:

~~~json
{
  "name": "Classroom Content Agent",
  "description": "Searches and lists public cybersecurity learning content published on Classroom.",
  "supportedInterfaces": [
    {
      "url": "https://classroom.anir0y.in/a2a",
      "protocolBinding": "JSONRPC",
      "protocolVersion": "1.0"
    }
  ],
  "version": "1.0.0",
  "documentationUrl": "https://classroom.anir0y.in/llms.txt",
  "capabilities": {
    "streaming": false,
    "pushNotifications": false,
    "extendedAgentCard": false
  },
  "defaultInputModes": ["text/plain", "application/json"],
  "defaultOutputModes": ["text/plain", "application/json"],
  "skills": [
    {
      "id": "search-classroom-content",
      "name": "Search Classroom Content",
      "description": "Searches published Classroom cybersecurity articles by keyword or phrase.",
      "tags": ["cybersecurity", "learning", "search"],
      "examples": ["search: nmap"],
      "inputModes": ["text/plain", "application/json"],
      "outputModes": ["text/plain", "application/json"]
    },
    {
      "id": "list-recent-classroom-posts",
      "name": "List Recent Classroom Posts",
      "description": "Lists the most recently published Classroom cybersecurity articles.",
      "tags": ["cybersecurity", "learning", "recent-posts"],
      "examples": ["Show the latest Classroom posts"],
      "inputModes": ["text/plain", "application/json"],
      "outputModes": ["text/plain", "application/json"]
    }
  ]
}
~~~

- [ ] **Step 2: Create the Worker package metadata**

Create cloudflare/a2a-worker/package.json:

~~~json
{
  "name": "@classroom/a2a-worker",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.21.0",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "check": "pnpm typecheck && pnpm test",
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "5.20260810.1",
    "typescript": "7.0.2",
    "vitest": "4.1.10",
    "wrangler": "4.120.0"
  }
}
~~~

Create cloudflare/a2a-worker/tsconfig.json:

~~~json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "WebWorker"],
    "types": ["@cloudflare/workers-types", "vitest/globals"],
    "strict": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
~~~

Create cloudflare/a2a-worker/wrangler.jsonc:

~~~jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "classroom-a2a",
  "main": "src/index.ts",
  "compatibility_date": "2026-08-10",
  "workers_dev": true,
  "routes": [
    {
      "pattern": "classroom.anir0y.in/a2a*",
      "zone_name": "anir0y.in"
    },
    {
      "pattern": "classroom.anir0y.in/.well-known/agent-card.json*",
      "zone_name": "anir0y.in"
    }
  ]
}
~~~

- [ ] **Step 3: Generate the pnpm lockfile**

Run:

~~~bash
cd cloudflare/a2a-worker
COREPACK_HOME=/private/tmp/classroom-corepack pnpm install
~~~

Expected: dependencies install and pnpm-lock.yaml is created. Do not use npm.

- [ ] **Step 4: Re-run the Hugo discovery gate**

Run:

~~~bash
./scripts/validate_agent_discovery.sh
~~~

Expected: PASS for the new Agent Card and all existing discovery surfaces.

### Task 3: Implement pure deterministic agent behavior with TDD

**Files:**
- Create: cloudflare/a2a-worker/test/agent.test.ts
- Create: cloudflare/a2a-worker/src/agent.ts

- [ ] **Step 1: Write failing tests for text, structured input, fallbacks, and limits**

The tests must cover:

~~~typescript
import { describe, expect, it } from "vitest";
import { executeAgentRequest, parseAgentAction } from "../src/agent";

const posts = [
  {
    title: "Nmap Basics",
    summary: null,
    content: "Learn network discovery with Nmap.",
    permalink: "https://classroom.anir0y.in/post/nmap/"
  },
  {
    title: "Phishing Analysis",
    summary: "Analyze suspicious messages.",
    content: "Email investigation",
    permalink: "https://classroom.anir0y.in/post/phishing/"
  }
];

describe("parseAgentAction", () => {
  it("parses search text and clamps the limit", () => {
    expect(parseAgentAction([{ text: "search: nmap" }], 99)).toEqual({
      action: "search",
      query: "nmap",
      limit: 10
    });
  });

  it("parses a structured recent request", () => {
    expect(parseAgentAction([{ data: { action: "recent", limit: 1 } }])).toEqual({
      action: "recent",
      limit: 1
    });
  });
});

describe("executeAgentRequest", () => {
  it("searches current posts and derives a summary when summary is null", () => {
    const result = executeAgentRequest(
      { action: "search", query: "nmap", limit: 5 },
      posts
    );
    expect(result.results).toEqual([
      {
        title: "Nmap Basics",
        url: "https://classroom.anir0y.in/post/nmap/",
        summary: "Learn network discovery with Nmap."
      }
    ]);
  });

  it("lists recent posts in index order", () => {
    expect(executeAgentRequest({ action: "recent", limit: 1 }, posts).results)
      .toHaveLength(1);
  });
});
~~~

- [ ] **Step 2: Run tests and verify RED**

Run:

~~~bash
cd cloudflare/a2a-worker
COREPACK_HOME=/private/tmp/classroom-corepack pnpm test test/agent.test.ts
~~~

Expected: FAIL because src/agent.ts does not exist.

- [ ] **Step 3: Implement the pure agent module**

Implement these exported contracts in src/agent.ts:

~~~typescript
export interface ContentPost {
  title?: unknown;
  summary?: unknown;
  content?: unknown;
  permalink?: unknown;
}

export type AgentAction =
  | { action: "search"; query: string; limit: number }
  | { action: "recent"; limit: number };

export interface AgentResultPost {
  title: string;
  url: string;
  summary: string;
}

export function parseAgentAction(
  parts: unknown,
  configuredLimit?: unknown
): AgentAction;

export function executeAgentRequest(
  action: AgentAction,
  posts: ContentPost[]
): {
  action: AgentAction["action"];
  query?: string;
  results: AgentResultPost[];
};
~~~

Implementation rules:

- Reject missing/empty parts with an InvalidAgentInputError.
- Prefer the first valid structured data action.
- Clamp limits to 1-10 with a default of 5.
- Treat text containing recent or latest plus post/articles as recent.
- Treat search: text as an explicit query and all other text as a query.
- Ignore entries without a non-empty permalink.
- Fall back from null/empty summary to normalized content, truncated to 240 characters.
- Fall back from null/empty title to Untitled post.

- [ ] **Step 4: Run the pure tests and verify GREEN**

Run:

~~~bash
COREPACK_HOME=/private/tmp/classroom-corepack pnpm test test/agent.test.ts
~~~

Expected: all agent tests pass.

### Task 4: Implement live-index caching and last-known-good fallback with TDD

**Files:**
- Create: cloudflare/a2a-worker/test/content-index.test.ts
- Create: cloudflare/a2a-worker/src/content-index.ts

- [ ] **Step 1: Write failing cache tests**

Use an in-memory Cache API fake and cover:

~~~typescript
it("returns a fresh cached index without fetching origin", async () => {
  // Seed the fresh key, call loadContentIndex, assert fetcher was not called.
});

it("refreshes from the live index when fresh cache is absent", async () => {
  // Return a new post from fetcher and assert it is returned and cached.
});

it("uses the stale last-known-good index when origin fails", async () => {
  // Seed only the stale key, reject fetcher, and assert stale data is returned.
});

it("surfaces origin failure when no cached index exists", async () => {
  // Reject fetcher and expect ContentIndexUnavailableError.
});

it("rejects a null or non-array origin payload", async () => {
  // Return JSON null and expect ContentIndexUnavailableError without empty results.
});
~~~

- [ ] **Step 2: Run cache tests and verify RED**

Run:

~~~bash
COREPACK_HOME=/private/tmp/classroom-corepack pnpm test test/content-index.test.ts
~~~

Expected: FAIL because src/content-index.ts does not exist.

- [ ] **Step 3: Implement the cache loader**

Implement:

~~~typescript
export const CONTENT_INDEX_URL =
  "https://classroom.anir0y.in/index.json";
export const FRESH_CACHE_KEY =
  "https://a2a-cache.internal/classroom-index/fresh";
export const STALE_CACHE_KEY =
  "https://a2a-cache.internal/classroom-index/stale";

export class ContentIndexUnavailableError extends Error {}

export async function loadContentIndex(options: {
  cache: Pick<Cache, "match" | "put">;
  fetcher?: typeof fetch;
  logger?: Pick<Console, "error">;
}): Promise<ContentPost[]>;
~~~

The loader must:

1. Return valid JSON from the fresh key when present.
2. Fetch CONTENT_INDEX_URL with Accept: application/json and cache: no-store.
3. Require HTTP 200 and an array JSON payload.
4. Store identical payloads under fresh max-age=60 and stale max-age=86400 keys.
5. On fetch/validation failure, log the error and return valid stale data.
6. Throw ContentIndexUnavailableError if neither live nor stale data is valid.

- [ ] **Step 4: Run cache tests and verify GREEN**

Run:

~~~bash
COREPACK_HOME=/private/tmp/classroom-corepack pnpm test test/content-index.test.ts
~~~

Expected: all cache tests pass.

### Task 5: Implement the Worker HTTP and JSON-RPC surface with TDD

**Files:**
- Create: cloudflare/a2a-worker/test/worker.test.ts
- Create: cloudflare/a2a-worker/src/index.ts

- [ ] **Step 1: Write failing Worker tests**

Cover these observable behaviors:

~~~typescript
it("serves the shared Agent Card as application/a2a+json", async () => {
  const response = await handler(
    new Request("https://classroom.anir0y.in/.well-known/agent-card.json")
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/a2a+json");
  expect((await response.json()).supportedInterfaces[0].protocolBinding)
    .toBe("JSONRPC");
});

it("handles A2A 1.0 SendMessage and preserves the request id", async () => {
  const response = await handler(new Request(
    "https://classroom.anir0y.in/a2a",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "a2a-version": "1.0"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "request-1",
        method: "SendMessage",
        params: {
          message: {
            messageId: "message-1",
            role: "ROLE_USER",
            parts: [{ text: "search: nmap" }]
          }
        }
      })
    }
  ));
  const body = await response.json();
  expect(body.id).toBe("request-1");
  expect(body.result.message.role).toBe("ROLE_AGENT");
  expect(body.result.message.parts[1].data.results).toHaveLength(1);
});
~~~

Also test:

- HEAD card response has no body.
- ETag conditional GET returns 304.
- GET /a2a returns 405 with Allow: POST.
- Malformed JSON returns -32700.
- Missing JSON-RPC fields returns -32600.
- Invalid SendMessage parameters returns -32602.
- Unknown methods return -32601.
- A2A-Version other than 1.0 returns -32009 and supportedVersions.
- Content index failure returns -32603 with retryable metadata.
- Unknown paths return 404.

- [ ] **Step 2: Run Worker tests and verify RED**

Run:

~~~bash
COREPACK_HOME=/private/tmp/classroom-corepack pnpm test test/worker.test.ts
~~~

Expected: FAIL because src/index.ts does not exist.

- [ ] **Step 3: Implement the Worker handler**

Export a testable factory:

~~~typescript
export function createHandler(dependencies: {
  loadIndex: () => Promise<ContentPost[]>;
  randomUUID?: () => string;
}): (request: Request) => Promise<Response>;
~~~

The production default export supplies:

~~~typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const handler = createHandler({
      loadIndex: () =>
        loadContentIndex({
          cache: caches.default,
          fetcher: fetch,
          logger: console
        }),
      randomUUID: () => crypto.randomUUID()
    });
    return handler(request);
  }
} satisfies ExportedHandler;
~~~

For a successful SendMessage response, return:

~~~json
{
  "jsonrpc": "2.0",
  "id": "request-1",
  "result": {
    "message": {
      "messageId": "generated-uuid",
      "contextId": "request-context-or-generated-uuid",
      "role": "ROLE_AGENT",
      "parts": [
        { "text": "Found 1 Classroom post." },
        {
          "data": {
            "action": "search",
            "query": "nmap",
            "results": []
          }
        }
      ]
    }
  }
}
~~~

Serve the imported static Agent Card with:

- Content-Type: application/a2a+json; charset=utf-8
- Cache-Control: public, max-age=300
- ETag: W/"classroom-a2a-1.0.0"

- [ ] **Step 4: Run all Worker checks and verify GREEN**

Run:

~~~bash
COREPACK_HOME=/private/tmp/classroom-corepack pnpm typecheck
COREPACK_HOME=/private/tmp/classroom-corepack pnpm test
~~~

Expected: TypeScript exits 0 and all Vitest tests pass without warnings.

### Task 6: Final integration verification and scoped handoff

**Files:**
- Modify if required by verified failures only: files from Tasks 1-5

- [ ] **Step 1: Run repository-local discovery validation**

Run:

~~~bash
./scripts/validate_agent_discovery.sh
~~~

Expected: Agent discovery validation passed.

- [ ] **Step 2: Run a fresh Hugo production build**

Run:

~~~bash
hugo --minify
~~~

Expected: exit 0 and public/.well-known/agent-card.json exists.

- [ ] **Step 3: Validate the generated card independently**

Run:

~~~bash
python3 -m json.tool public/.well-known/agent-card.json
~~~

Expected: valid formatted JSON and exit 0.

- [ ] **Step 4: Audit the final scope**

Run:

~~~bash
git status --short
git diff --check
git diff --stat
~~~

Expected: only the A2A implementation, validation, plan, and pre-existing
.DS_Store modifications are present. Do not stage or alter the .DS_Store files.

- [ ] **Step 5: Record the deployment gate**

Do not run wrangler deploy. Report that deployment requires a separate
confirmation after verifying the hostname is Cloudflare-proxied and the
anir0y.in account/zone is the intended target.
