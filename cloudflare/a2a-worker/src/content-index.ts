import type { ContentPost } from "./agent";

export const CONTENT_INDEX_URL = "https://classroom.anir0y.in/index.json";
export const FRESH_CACHE_KEY =
  "https://classroom.anir0y.in/__cf-worker-cache/a2a-index/fresh";
export const STALE_CACHE_KEY =
  "https://classroom.anir0y.in/__cf-worker-cache/a2a-index/stale";

export class ContentIndexUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Classroom's content index is temporarily unavailable.", { cause });
    this.name = "ContentIndexUnavailableError";
  }
}

interface LoadContentIndexOptions {
  cache: Pick<Cache, "match" | "put">;
  fetcher?: typeof fetch;
  logger?: Pick<Console, "error">;
  waitUntil?: (promise: Promise<unknown>) => void;
}

function isUsableContentIndex(payload: unknown): payload is ContentPost[] {
  return (
    Array.isArray(payload) &&
    payload.length > 0 &&
    payload.every(
      (post) =>
        typeof post === "object" &&
        post !== null &&
        "permalink" in post &&
        typeof post.permalink === "string" &&
        post.permalink.trim().length > 0,
    )
  );
}

async function readCachedIndex(
  cache: Pick<Cache, "match">,
  key: string,
): Promise<ContentPost[] | null> {
  try {
    const response = await cache.match(key);
    if (!response) {
      return null;
    }

    const payload: unknown = await response.json();
    return isUsableContentIndex(payload) ? payload : null;
  } catch {
    return null;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown origin error";
}

function cachedResponse(payload: string, maxAge: number): Response {
  return new Response(payload, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${maxAge}`,
    },
  });
}

export async function loadContentIndex({
  cache,
  fetcher = fetch,
  logger = console,
  waitUntil,
}: LoadContentIndexOptions): Promise<ContentPost[]> {
  const fresh = await readCachedIndex(cache, FRESH_CACHE_KEY);
  if (fresh) {
    return fresh;
  }

  let originFailure: unknown;
  try {
    const response = await fetcher(CONTENT_INDEX_URL, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (response.status !== 200) {
      throw new Error(`Content index returned HTTP ${response.status}`);
    }

    const payload: unknown = await response.json();
    if (!isUsableContentIndex(payload)) {
      throw new Error("Content index payload has no usable posts");
    }

    const serialized = JSON.stringify(payload);
    const cacheWrite = Promise.all([
      cache.put(FRESH_CACHE_KEY, cachedResponse(serialized, 60)),
      cache.put(STALE_CACHE_KEY, cachedResponse(serialized, 86_400)),
    ]).catch((error: unknown) => {
      logger.error(
        JSON.stringify({
          event: "a2a_content_index_cache_write_failed",
          error: errorMessage(error),
        }),
      );
    });

    if (waitUntil) {
      waitUntil(cacheWrite);
    } else {
      await cacheWrite;
    }

    return payload;
  } catch (error: unknown) {
    originFailure = error;
    logger.error(
      JSON.stringify({
        event: "a2a_content_index_refresh_failed",
        url: CONTENT_INDEX_URL,
        error: errorMessage(error),
      }),
    );
  }

  const stale = await readCachedIndex(cache, STALE_CACHE_KEY);
  if (stale) {
    return stale;
  }

  throw new ContentIndexUnavailableError(originFailure);
}
