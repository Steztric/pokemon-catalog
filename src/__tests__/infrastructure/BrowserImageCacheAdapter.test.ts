import { describe, it, expect, beforeEach, vi } from "vitest";
import { BrowserImageCacheAdapter } from "../../infrastructure/cache/BrowserImageCacheAdapter";

function makeMockCache() {
  const store = new Map<string, Response>();
  return {
    put: vi.fn(async (key: string, value: Response) => {
      store.set(key, value);
    }),
    match: vi.fn(async (key: string) => store.get(key)),
    store,
  };
}

describe("BrowserImageCacheAdapter", () => {
  let adapter: BrowserImageCacheAdapter;
  let mockCache: ReturnType<typeof makeMockCache>;
  const cardId = "base1-4";
  const imageData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer;

  beforeEach(() => {
    mockCache = makeMockCache();
    vi.stubGlobal("caches", {
      open: vi.fn().mockResolvedValue(mockCache),
    });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:test-url"),
    });
    adapter = new BrowserImageCacheAdapter();
  });

  it("has() returns false when image is not cached", async () => {
    expect(await adapter.has(cardId)).toBe(false);
  });

  it("get() returns null when image is not cached", async () => {
    expect(await adapter.get(cardId)).toBeNull();
  });

  it("set() stores the image in the cache", async () => {
    await adapter.set(cardId, imageData);
    expect(mockCache.put).toHaveBeenCalledOnce();
    const [key] = mockCache.put.mock.calls[0] as [string, Response];
    expect(key).toContain(cardId);
  });

  it("has() returns true after set()", async () => {
    await adapter.set(cardId, imageData);
    expect(await adapter.has(cardId)).toBe(true);
  });

  it("get() returns a URL after set()", async () => {
    await adapter.set(cardId, imageData);
    const url = await adapter.get(cardId);
    expect(url).toBeTruthy();
  });

  it("set() stores response with image/jpeg content type", async () => {
    await adapter.set(cardId, imageData);
    const [, response] = mockCache.put.mock.calls[0] as [string, Response];
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
  });
});
