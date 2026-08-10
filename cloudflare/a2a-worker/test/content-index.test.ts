import { describe, expect, it, vi } from "vitest";

import {
  CONTENT_INDEX_URL,
  ContentIndexUnavailableError,
  FRESH_CACHE_KEY,
  STALE_CACHE_KEY,
  loadContentIndex,
} from "../src/content-index";

const livePosts = [
  {
    title: "Nmap Basics",
    summary: "Network discovery",
    content: "Nmap content",
    permalink: "https://classroom.anir0y.in/post/nmap/",
  },
];

class MemoryCache implements Pick<Cache, "match" | "put"> {
  readonly entries = new Map<string, Response>();

  async match(request: RequestInfo): Promise<Response | undefined> {
    const response = this.entries.get(this.key(request));
    return response?.clone();
  }

  async put(request: RequestInfo, response: Response): Promise<void> {
    this.entries.set(this.key(request), response.clone());
  }

  seed(key: string, value: unknown): void {
    this.entries.set(
      key,
      new Response(JSON.stringify(value), {
        headers: { "content-type": "application/json" },
      }),
    );
  }

  private key(request: RequestInfo): string {
    return typeof request === "string" ? request : request.url;
  }
}

function fetcher(response: Response | Error): typeof fetch {
  return vi.fn(async () => {
    if (response instanceof Error) {
      throw response;
    }
    return response.clone();
  }) as unknown as typeof fetch;
}

describe("loadContentIndex", () => {
  it("uses cache keys owned by the Classroom zone", () => {
    expect(new URL(FRESH_CACHE_KEY).hostname).toBe("classroom.anir0y.in");
    expect(new URL(STALE_CACHE_KEY).hostname).toBe("classroom.anir0y.in");
  });

  it("returns a fresh cached index without fetching the origin", async () => {
    const cache = new MemoryCache();
    cache.seed(FRESH_CACHE_KEY, livePosts);
    const origin = fetcher(new Error("origin should not be called"));

    await expect(loadContentIndex({ cache, fetcher: origin })).resolves.toEqual(
      livePosts,
    );
    expect(origin).not.toHaveBeenCalled();
  });

  it("refreshes from the live index and schedules both cache writes", async () => {
    const cache = new MemoryCache();
    const origin = fetcher(
      new Response(JSON.stringify(livePosts), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const pending: Promise<unknown>[] = [];

    const result = await loadContentIndex({
      cache,
      fetcher: origin,
      waitUntil: (promise) => pending.push(promise),
    });
    await Promise.all(pending);

    expect(result).toEqual(livePosts);
    expect(origin).toHaveBeenCalledWith(CONTENT_INDEX_URL, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    expect(pending).toHaveLength(1);
    expect(await cache.match(FRESH_CACHE_KEY)).toBeDefined();
    expect(await cache.match(STALE_CACHE_KEY)).toBeDefined();
  });

  it("uses the stale last-known-good index when the origin fails", async () => {
    const cache = new MemoryCache();
    cache.seed(STALE_CACHE_KEY, livePosts);
    const logger = { error: vi.fn() };

    await expect(
      loadContentIndex({
        cache,
        fetcher: fetcher(new Error("origin unavailable")),
        logger,
      }),
    ).resolves.toEqual(livePosts);
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it("surfaces an origin failure when no cached index exists", async () => {
    await expect(
      loadContentIndex({
        cache: new MemoryCache(),
        fetcher: fetcher(new Error("origin unavailable")),
        logger: { error: vi.fn() },
      }),
    ).rejects.toBeInstanceOf(ContentIndexUnavailableError);
  });

  it("rejects a null or non-array origin payload", async () => {
    await expect(
      loadContentIndex({
        cache: new MemoryCache(),
        fetcher: fetcher(
          new Response("null", {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        ),
        logger: { error: vi.fn() },
      }),
    ).rejects.toBeInstanceOf(ContentIndexUnavailableError);
  });
});
