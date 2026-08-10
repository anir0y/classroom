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

export class InvalidAgentInputError extends Error {
  constructor(message = "The message must contain a search or recent-post request.") {
    super(message);
    this.name = "InvalidAgentInputError";
  }
}

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;
const SUMMARY_LIMIT = 240;

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function normalizeLimit(value: unknown, fallback = DEFAULT_LIMIT): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(value)));
}

function structuredActionFromPart(part: unknown): AgentAction | null {
  if (typeof part !== "object" || part === null || !("data" in part)) {
    return null;
  }

  const data = part.data;
  if (typeof data !== "object" || data === null || !("action" in data)) {
    return null;
  }

  if (data.action === "recent") {
    return {
      action: "recent",
      limit: normalizeLimit("limit" in data ? data.limit : undefined),
    };
  }

  if (data.action === "search") {
    const query = normalizeText("query" in data ? data.query : undefined);
    if (query) {
      return {
        action: "search",
        query,
        limit: normalizeLimit("limit" in data ? data.limit : undefined),
      };
    }
  }

  return null;
}

export function parseAgentAction(
  parts: unknown,
  configuredLimit?: unknown,
): AgentAction {
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new InvalidAgentInputError();
  }

  for (const part of parts) {
    const action = structuredActionFromPart(part);
    if (action) {
      return action;
    }
  }

  const limit = normalizeLimit(configuredLimit);
  for (const part of parts) {
    if (typeof part !== "object" || part === null || !("text" in part)) {
      continue;
    }

    const text = normalizeText(part.text);
    if (!text) {
      continue;
    }

    if (/\b(recent|latest)\b/i.test(text) && /\b(posts?|articles?)\b/i.test(text)) {
      return { action: "recent", limit };
    }

    const explicitSearch = /^search\s*:\s*(.*)$/i.exec(text);
    const query = normalizeText(explicitSearch ? explicitSearch[1] : text);
    if (query) {
      return { action: "search", query, limit };
    }
  }

  throw new InvalidAgentInputError();
}

function resultPost(post: ContentPost): AgentResultPost | null {
  const url = normalizeText(post.permalink);
  if (!url) {
    return null;
  }

  const title = normalizeText(post.title) || "Untitled post";
  const summary =
    normalizeText(post.summary) || normalizeText(post.content).slice(0, SUMMARY_LIMIT);

  return { title, url, summary };
}

export function executeAgentRequest(
  action: AgentAction,
  posts: ContentPost[],
): {
  action: AgentAction["action"];
  query?: string;
  results: AgentResultPost[];
} {
  const candidates = posts.flatMap((post) => {
    const result = resultPost(post);
    return result ? [{ post, result }] : [];
  });

  if (action.action === "recent") {
    return {
      action: "recent",
      results: candidates.slice(0, action.limit).map(({ result }) => result),
    };
  }

  const query = action.query.toLowerCase();
  const results = candidates
    .filter(({ post }) =>
      [post.title, post.summary, post.content, post.permalink]
        .map(normalizeText)
        .join(" ")
        .toLowerCase()
        .includes(query),
    )
    .slice(0, action.limit)
    .map(({ result }) => result);

  return { action: "search", query: action.query, results };
}
