import agentCard from "../../../static/.well-known/agent-card.json";

import {
  InvalidAgentInputError,
  executeAgentRequest,
  parseAgentAction,
  type ContentPost,
} from "./agent";
import {
  ContentIndexUnavailableError,
  loadContentIndex,
} from "./content-index";

const AGENT_CARD_PATH = "/.well-known/agent-card.json";
const A2A_PATH = "/a2a";
const A2A_VERSION = "1.0";
const AGENT_CARD_ETAG = 'W/"classroom-a2a-1.0.0"';
const AGENT_CARD_BODY = JSON.stringify(agentCard);

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: unknown;
}

interface ErrorDetail {
  "@type": string;
  [key: string]: unknown;
}

interface HandlerDependencies {
  loadIndex: () => Promise<ContentPost[]>;
  randomUUID?: () => string;
}

function agentCardHeaders(): Headers {
  return new Headers({
    "content-type": "application/a2a+json; charset=utf-8",
    "cache-control": "public, max-age=300",
    etag: AGENT_CARD_ETAG,
  });
}

function etagMatches(request: Request): boolean {
  const value = request.headers.get("if-none-match");
  return (
    value !== null &&
    (value.trim() === "*" ||
      value
        .split(",")
        .map((candidate) => candidate.trim())
        .includes(AGENT_CARD_ETAG))
  );
}

function serveAgentCard(request: Request): Response {
  const headers = agentCardHeaders();
  if (request.method !== "GET" && request.method !== "HEAD") {
    headers.set("allow", "GET, HEAD");
    return new Response("Method Not Allowed", { status: 405, headers });
  }

  if (etagMatches(request)) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(request.method === "HEAD" ? null : AGENT_CARD_BODY, {
    status: 200,
    headers,
  });
}

function jsonRpcResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "a2a-version": A2A_VERSION,
    },
  });
}

function jsonRpcError(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: ErrorDetail[],
): Response {
  return jsonRpcResponse({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      ...(data ? { data } : {}),
    },
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRequestId(value: unknown): value is string | number {
  return (
    typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  return (
    isObject(value) &&
    value.jsonrpc === "2.0" &&
    isRequestId(value.id) &&
    typeof value.method === "string" &&
    value.method.length > 0
  );
}

function protocolVersion(request: Request): string {
  const url = new URL(request.url);
  const requested =
    request.headers.get("a2a-version") ??
    url.searchParams.get("A2A-Version") ??
    "0.3";
  return requested.trim() || "0.3";
}

function versionNotSupported(id: JsonRpcId, requestedVersion: string): Response {
  return jsonRpcError(id, -32009, "Protocol version not supported", [
    {
      "@type": "type.googleapis.com/google.rpc.ErrorInfo",
      reason: "VERSION_NOT_SUPPORTED",
      domain: "a2a-protocol.org",
      metadata: {
        requestedVersion,
        supportedVersions: A2A_VERSION,
      },
    },
  ]);
}

function invalidParams(id: JsonRpcId, description: string): Response {
  return jsonRpcError(id, -32602, "Invalid parameters", [
    {
      "@type": "type.googleapis.com/google.rpc.BadRequest",
      fieldViolations: [
        {
          field: "params.message",
          description,
        },
      ],
    },
  ]);
}

function messageParts(params: unknown): {
  parts: unknown[];
  contextId?: string;
} | null {
  if (!isObject(params) || !isObject(params.message)) {
    return null;
  }

  const { message } = params;
  if (
    typeof message.messageId !== "string" ||
    message.messageId.trim().length === 0 ||
    message.role !== "ROLE_USER" ||
    !Array.isArray(message.parts)
  ) {
    return null;
  }

  return {
    parts: message.parts,
    ...(typeof message.contextId === "string" && message.contextId.trim()
      ? { contextId: message.contextId }
      : {}),
  };
}

async function handleA2ARequest(
  request: Request,
  dependencies: Required<HandlerDependencies>,
): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonRpcError(null, -32700, "Invalid JSON payload");
  }

  if (!isJsonRpcRequest(payload)) {
    return jsonRpcError(null, -32600, "Request payload validation error");
  }

  const requestedVersion = protocolVersion(request);
  if (requestedVersion !== A2A_VERSION) {
    return versionNotSupported(payload.id, requestedVersion);
  }

  if (payload.method !== "SendMessage") {
    return jsonRpcError(payload.id, -32601, "Method not found");
  }

  const input = messageParts(payload.params);
  if (!input) {
    return invalidParams(payload.id, "A valid user message is required");
  }

  let action;
  try {
    action = parseAgentAction(input.parts);
  } catch (error: unknown) {
    if (error instanceof InvalidAgentInputError) {
      return invalidParams(payload.id, error.message);
    }
    throw error;
  }

  try {
    const posts = await dependencies.loadIndex();
    const result = executeAgentRequest(action, posts);
    const count = result.results.length;
    const messageId = dependencies.randomUUID();
    const contextId = input.contextId ?? dependencies.randomUUID();
    const summary =
      "Found " +
      count +
      " Classroom " +
      (count === 1 ? "post" : "posts") +
      ".";

    return jsonRpcResponse({
      jsonrpc: "2.0",
      id: payload.id,
      result: {
        message: {
          messageId,
          contextId,
          role: "ROLE_AGENT",
          parts: [{ text: summary }, { data: result }],
        },
      },
    });
  } catch (error: unknown) {
    const retryable = error instanceof ContentIndexUnavailableError;
    return jsonRpcError(payload.id, -32603, "Internal error", [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        reason: retryable
          ? "CONTENT_INDEX_UNAVAILABLE"
          : "INTERNAL_AGENT_ERROR",
        domain: "classroom.anir0y.in",
        metadata: { retryable: String(retryable) },
      },
    ]);
  }
}

export function createHandler({
  loadIndex,
  randomUUID = () => crypto.randomUUID(),
}: HandlerDependencies): (request: Request) => Promise<Response> {
  const dependencies = { loadIndex, randomUUID };

  return async (request: Request): Promise<Response> => {
    const { pathname } = new URL(request.url);

    if (pathname === AGENT_CARD_PATH) {
      return serveAgentCard(request);
    }

    if (pathname !== A2A_PATH) {
      return new Response("Not Found", { status: 404 });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { allow: "POST" },
      });
    }

    return handleA2ARequest(request, dependencies);
  };
}

export default {
  async fetch(
    request: Request,
    _env: unknown,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const handler = createHandler({
      loadIndex: () =>
        loadContentIndex({
          cache: caches.default,
          fetcher: fetch,
          logger: console,
          waitUntil: (promise) => ctx.waitUntil(promise),
        }),
    });
    return handler(request);
  },
} satisfies ExportedHandler;
