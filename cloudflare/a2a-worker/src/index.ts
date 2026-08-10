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
const CONTENT_FIELDS = ["text", "raw", "url", "data"] as const;
const PUSH_NOTIFICATION_METHODS = new Set([
  "CreateTaskPushNotificationConfig",
  "GetTaskPushNotificationConfig",
  "ListTaskPushNotificationConfigs",
  "DeleteTaskPushNotificationConfig",
]);
const UNSUPPORTED_A2A_METHODS = new Set([
  "SendStreamingMessage",
  "GetTask",
  "ListTasks",
  "CancelTask",
  "SubscribeToTask",
  "GetExtendedAgentCard",
]);

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

type MessageValidation =
  | {
      valid: true;
      parts: unknown[];
      contextId?: string;
    }
  | {
      valid: false;
      response: Response;
    };

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

function a2aError(
  id: JsonRpcId,
  code: number,
  message: string,
  reason: string,
  metadata: Record<string, string> = {},
): Response {
  return jsonRpcError(id, code, message, [
    {
      "@type": "type.googleapis.com/google.rpc.ErrorInfo",
      reason,
      domain: "a2a-protocol.org",
      metadata,
    },
  ]);
}

function taskNotFound(id: JsonRpcId, taskId: string): Response {
  return a2aError(id, -32001, "Task not found", "TASK_NOT_FOUND", { taskId });
}

function pushNotificationsNotSupported(id: JsonRpcId): Response {
  return a2aError(
    id,
    -32003,
    "Push notifications are not supported",
    "PUSH_NOTIFICATION_NOT_SUPPORTED",
  );
}

function unsupportedOperation(id: JsonRpcId, method: string): Response {
  return a2aError(
    id,
    -32004,
    "Operation not supported",
    "UNSUPPORTED_OPERATION",
    { method },
  );
}

function contentTypeNotSupported(
  id: JsonRpcId,
  mediaType: string,
): Response {
  return a2aError(
    id,
    -32005,
    "Content type not supported",
    "CONTENT_TYPE_NOT_SUPPORTED",
    { mediaType },
  );
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

function owns(object: Record<string, unknown>, property: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function normalizedMediaType(value: string): string {
  return value.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

function validateMessage(
  params: unknown,
  id: JsonRpcId,
): MessageValidation {
  if (!isObject(params) || !isObject(params.message)) {
    return {
      valid: false,
      response: invalidParams(id, "A valid user message is required"),
    };
  }

  if (owns(params, "configuration")) {
    if (!isObject(params.configuration)) {
      return {
        valid: false,
        response: invalidParams(id, "configuration must be an object"),
      };
    }
    if (
      owns(params.configuration, "taskPushNotificationConfig") &&
      params.configuration.taskPushNotificationConfig !== null
    ) {
      return { valid: false, response: pushNotificationsNotSupported(id) };
    }
  }

  const { message } = params;
  if (
    typeof message.messageId !== "string" ||
    message.messageId.trim().length === 0 ||
    message.role !== "ROLE_USER" ||
    !Array.isArray(message.parts) ||
    message.parts.length === 0
  ) {
    return {
      valid: false,
      response: invalidParams(id, "A valid user message is required"),
    };
  }

  if (owns(message, "taskId")) {
    if (typeof message.taskId !== "string" || !message.taskId.trim()) {
      return {
        valid: false,
        response: invalidParams(id, "taskId must be a non-empty string"),
      };
    }
    return {
      valid: false,
      response: taskNotFound(id, message.taskId),
    };
  }

  if (
    owns(message, "contextId") &&
    (typeof message.contextId !== "string" || !message.contextId.trim())
  ) {
    return {
      valid: false,
      response: invalidParams(id, "contextId must be a non-empty string"),
    };
  }

  for (const part of message.parts) {
    if (!isObject(part)) {
      return {
        valid: false,
        response: invalidParams(id, "Each Part must be an object"),
      };
    }

    const contentFields = CONTENT_FIELDS.filter((field) => owns(part, field));
    if (contentFields.length !== 1) {
      return {
        valid: false,
        response: invalidParams(
          id,
          "Each Part must set exactly one content field",
        ),
      };
    }

    const contentField = contentFields[0];
    if (contentField === "raw" || contentField === "url") {
      const mediaType =
        typeof part.mediaType === "string"
          ? normalizedMediaType(part.mediaType)
          : contentField;
      return {
        valid: false,
        response: contentTypeNotSupported(id, mediaType),
      };
    }

    if (contentField === "text" && typeof part.text !== "string") {
      return {
        valid: false,
        response: invalidParams(id, "A text Part must contain a string"),
      };
    }

    if (owns(part, "mediaType")) {
      if (typeof part.mediaType !== "string") {
        return {
          valid: false,
          response: invalidParams(id, "Part mediaType must be a string"),
        };
      }
      const mediaType = normalizedMediaType(part.mediaType);
      const expectedMediaType =
        contentField === "text" ? "text/plain" : "application/json";
      if (mediaType !== expectedMediaType) {
        return {
          valid: false,
          response: contentTypeNotSupported(id, mediaType),
        };
      }
    }
  }

  return {
    valid: true,
    parts: message.parts,
    ...(typeof message.contextId === "string"
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

  if (PUSH_NOTIFICATION_METHODS.has(payload.method)) {
    return pushNotificationsNotSupported(payload.id);
  }

  if (UNSUPPORTED_A2A_METHODS.has(payload.method)) {
    return unsupportedOperation(payload.id, payload.method);
  }

  if (payload.method !== "SendMessage") {
    return jsonRpcError(payload.id, -32601, "Method not found");
  }

  const input = validateMessage(payload.params, payload.id);
  if (!input.valid) {
    return input.response;
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
