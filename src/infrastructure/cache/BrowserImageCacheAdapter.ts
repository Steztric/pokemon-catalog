import type { IImageCacheAdapter } from "../../domain/interfaces";

const CACHE_NAME = "card-images-v1";

function cacheKey(cardId: string): string {
  return `/card-images/${cardId}`;
}

function cacheAvailable(): boolean {
  return typeof caches !== "undefined";
}

export class BrowserImageCacheAdapter implements IImageCacheAdapter {
  async set(cardId: string, imageData: ArrayBuffer): Promise<void> {
    if (!cacheAvailable()) return;
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(
        cacheKey(cardId),
        new Response(imageData, { headers: { "Content-Type": "image/jpeg" } }),
      );
    } catch {
      // Cache API unavailable — image not persisted; falls back to remote URL on display
    }
  }

  async get(cardId: string): Promise<string | null> {
    if (!cacheAvailable()) return null;
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(cacheKey(cardId));
      if (!response) return null;
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }

  async has(cardId: string): Promise<boolean> {
    if (!cacheAvailable()) return false;
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(cacheKey(cardId));
      return response !== undefined;
    } catch {
      return false;
    }
  }
}
