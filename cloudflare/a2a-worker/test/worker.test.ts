import { describe, expect, it } from "vitest";

import { ContentIndexUnavailableError } from "../src/content-index";
import { createHandler } from "../src/index";

const posts = [
  {
    title: "Nmap Basics",
    summary: "Network discovery",
    content: "Learn Nmap scanning.",
    permalink: "https://classroom.anir0y.in/post/nmap/",
  },
];

function handler(
  loadIndex: () => Promise<typeof posts> = async () => posts,
): ReturnType<typeof createHandler> {
  return createHandler({
    loadIndex,
    randomUUID: () => "generated-uuid",
  });
}

function a2aRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request("https://classroom.anir0y.in/a2a", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "a2a-version": "1.0",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function sendMessageBody(parts: unknown[]): Record<string, unknown> {
  return {
    jsonrpc: "2.0",
    id: "request-1",
    method: "SendMessage",
    params: {
      message: {
        messageId: "message-1",
        contextId: "context-1",
        role: "ROLE_USER",
        parts,
      },
    },
  };
}

describe("Classroom A2A Worker", () => {
  it("serves the shared Agent Card as application/a2a+json", async () => {
    const response = await handler()(
      new Request(
        "https://classroom.anir0y.in/.well-known/agent-card.json",
      ),
    );
    const body = (await response.json()) as {
      supportedInterfaces: Array<{ protocolBinding: string }>;
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "application/a2a+json",
    );
    expect(body.supportedInterfaces[0]?.protocolBinding).toBe("JSONRPC");
  });

  it("serves a bodyless HEAD response for the Agent Card", async () => {
    const response = await handler()(
      new Request(
        "https://classroom.anir0y.in/.well-known/agent-card.json",
        { method: "HEAD" },
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
    expect(response.headers.get("etag")).toBe('W/"classroom-a2a-1.0.0"');
  });

  it("returns 304 when the Agent Card ETag matches", async () => {
    const response = await handler()(
      new Request(
        "https://classroom.anir0y.in/.well-known/agent-card.json",
        { headers: { "if-none-match": 'W/"classroom-a2a-1.0.0"' } },
      ),
    );

    expect(response.status).toBe(304);
    expect(await response.text()).toBe("");
  });

  it("rejects non-POST requests to /a2a", async () => {
    const response = await handler()(
      new Request("https://classroom.anir0y.in/a2a"),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });

  it("handles A2A 1.0 SendMessage and preserves the request id", async () => {
    const response = await handler()(
      a2aRequest(sendMessageBody([{ text: "search: nmap" }]), {
        "a2a-version": "1.0",
      }),
    );
    const body = (await response.json()) as {
      id: string;
      result: {
        message: {
          messageId: string;
          contextId: string;
          role: string;
          parts: Array<{
            text?: string;
            data?: { results: unknown[] };
          }>;
        };
      };
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("a2a-version")).toBe("1.0");
    expect(body.id).toBe("request-1");
    expect(body.result.message).toMatchObject({
      messageId: "generated-uuid",
      contextId: "context-1",
      role: "ROLE_AGENT",
    });
    expect(body.result.message.parts[0]?.text).toBe(
      "Found 1 Classroom post.",
    );
    expect(body.result.message.parts[1]?.data?.results).toHaveLength(1);
  });

  it("returns parse error for malformed JSON", async () => {
    const response = await handler()(
      new Request("https://classroom.anir0y.in/a2a", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "a2a-version": "1.0",
        },
        body: "{",
      }),
    );
    const body = (await response.json()) as {
      id: null;
      error: { code: number };
    };

    expect(body).toMatchObject({ id: null, error: { code: -32700 } });
  });

  it("returns invalid request when JSON-RPC fields are missing", async () => {
    const response = await handler()(a2aRequest({ method: "SendMessage" }));
    const body = (await response.json()) as { error: { code: number } };

    expect(body.error.code).toBe(-32600);
  });

  it("returns invalid params for an unusable SendMessage", async () => {
    const response = await handler()(
      a2aRequest(sendMessageBody([{ text: "   " }])),
    );
    const body = (await response.json()) as {
      id: string;
      error: { code: number };
    };

    expect(body).toMatchObject({ id: "request-1", error: { code: -32602 } });
  });

  it("returns method not found for unsupported methods", async () => {
    const response = await handler()(
      a2aRequest({
        jsonrpc: "2.0",
        id: "request-1",
        method: "GetTask",
      }),
    );
    const body = (await response.json()) as { error: { code: number } };

    expect(body.error.code).toBe(-32601);
  });

  it("returns the A2A version error and supported versions", async () => {
    const response = await handler()(
      a2aRequest(sendMessageBody([{ text: "search: nmap" }]), {
        "a2a-version": "2.0",
      }),
    );
    const body = (await response.json()) as {
      id: string;
      error: {
        code: number;
        data: Array<{ metadata: { supportedVersions: string } }>;
      };
    };

    expect(body).toMatchObject({
      id: "request-1",
      error: {
        code: -32009,
        data: [{ metadata: { supportedVersions: "1.0" } }],
      },
    });
  });

  it("treats a missing A2A version as legacy 0.3", async () => {
    const response = await handler()(
      new Request("https://classroom.anir0y.in/a2a", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sendMessageBody([{ text: "search: nmap" }])),
      }),
    );
    const body = (await response.json()) as {
      error: { code: number; data: Array<{ metadata: { requestedVersion: string } }> };
    };

    expect(body.error).toMatchObject({
      code: -32009,
      data: [{ metadata: { requestedVersion: "0.3" } }],
    });
  });

  it("surfaces content-index failure as a retryable internal error", async () => {
    const response = await handler(async () => {
      throw new ContentIndexUnavailableError();
    })(a2aRequest(sendMessageBody([{ text: "search: nmap" }])));
    const body = (await response.json()) as {
      id: string;
      error: {
        code: number;
        data: Array<{ metadata: { retryable: string } }>;
      };
    };

    expect(body).toMatchObject({
      id: "request-1",
      error: {
        code: -32603,
        data: [{ metadata: { retryable: "true" } }],
      },
    });
  });

  it("returns 404 for unknown paths", async () => {
    const response = await handler()(
      new Request("https://classroom.anir0y.in/not-a2a"),
    );

    expect(response.status).toBe(404);
  });
});
