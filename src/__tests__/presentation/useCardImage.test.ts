import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCardImage } from "../../presentation/hooks/useCardImage";
import type { IImageCacheAdapter } from "../../domain/interfaces";

function makeCache(resolvesWith: string | null): IImageCacheAdapter {
  return {
    get: vi.fn().mockResolvedValue(resolvesWith),
    set: vi.fn().mockResolvedValue(undefined),
    has: vi.fn().mockResolvedValue(resolvesWith !== null),
  };
}

describe("useCardImage", () => {
  const cardId = "base1-4";
  const remoteUrl = "https://example.com/charizard.png";

  it("returns remoteUrl initially", () => {
    const cache = makeCache(null);
    const { result } = renderHook(() =>
      useCardImage(cardId, remoteUrl, cache),
    );
    expect(result.current).toBe(remoteUrl);
  });

  it("returns remoteUrl when cache returns null", async () => {
    const cache = makeCache(null);
    const { result } = renderHook(() =>
      useCardImage(cardId, remoteUrl, cache),
    );
    await waitFor(() => expect(cache.get).toHaveBeenCalledWith(cardId));
    expect(result.current).toBe(remoteUrl);
  });

  it("switches to cached URL when cache has the image", async () => {
    const cachedUrl = "asset:///data/card-images/base1-4.jpg";
    const cache = makeCache(cachedUrl);
    const { result } = renderHook(() =>
      useCardImage(cardId, remoteUrl, cache),
    );
    await waitFor(() => expect(result.current).toBe(cachedUrl));
  });

  it("calls imageCache.get with the correct cardId", async () => {
    const cache = makeCache(null);
    renderHook(() => useCardImage(cardId, remoteUrl, cache));
    await waitFor(() => expect(cache.get).toHaveBeenCalledWith(cardId));
  });
});
