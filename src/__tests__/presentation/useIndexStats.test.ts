import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useIndexStats } from "../../presentation/hooks/useIndexStats";

vi.mock("../../infrastructure/platform", () => ({
  platform: {
    storage: {
      pHashIndexRepository: {
        count: vi.fn().mockResolvedValue(42),
      },
      cardRepository: {
        findAll: vi.fn().mockResolvedValue(new Array(100).fill({ id: "x", name: "Card", setId: "s", setName: "S", number: "1", rarity: "Common", type: "Pokemon", imageUrl: "" })),
      },
    },
  },
}));

vi.mock("../../infrastructure/vision/pHashIndexBuilder", () => ({
  buildPHashIndex: vi.fn().mockResolvedValue({ indexed: 0, skipped: 0 }),
  browserImageLoader: vi.fn(),
}));

describe("useIndexStats", () => {
  it("loads indexed and total counts on mount", async () => {
    const { result } = renderHook(() => useIndexStats());
    await waitFor(() => {
      expect(result.current.indexedCount).toBe(42);
      expect(result.current.totalCount).toBe(100);
    });
  });

  it("starts with isRebuilding false", () => {
    const { result } = renderHook(() => useIndexStats());
    expect(result.current.isRebuilding).toBe(false);
  });

  it("exposes a rebuild function", () => {
    const { result } = renderHook(() => useIndexStats());
    expect(typeof result.current.rebuild).toBe("function");
  });
});
