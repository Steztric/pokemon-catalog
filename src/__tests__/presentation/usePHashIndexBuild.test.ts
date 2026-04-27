import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePHashIndexBuild } from "../../presentation/hooks/usePHashIndexBuild";

vi.mock("../../infrastructure/platform", () => ({
  platform: {
    storage: {
      cardRepository: {
        findAll: vi.fn().mockResolvedValue([]),
      },
      pHashIndexRepository: {},
    },
  },
}));

vi.mock("../../infrastructure/vision/pHashIndexBuilder", () => ({
  buildPHashIndex: vi.fn().mockResolvedValue({ indexed: 0, skipped: 0 }),
  browserImageLoader: vi.fn(),
}));

describe("usePHashIndexBuild", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with isBuilding true", () => {
    const { result } = renderHook(() => usePHashIndexBuild());
    expect(result.current.isBuilding).toBe(true);
  });

  it("sets isBuilding to false after buildPHashIndex resolves", async () => {
    const { result } = renderHook(() => usePHashIndexBuild());
    await waitFor(() => expect(result.current.isBuilding).toBe(false));
  });

  it("calls buildPHashIndex with the cards from the repository", async () => {
    const { buildPHashIndex } = await import("../../infrastructure/vision/pHashIndexBuilder");
    const { platform } = await import("../../infrastructure/platform");
    const cards = [{ id: "base1-4", name: "Charizard", setId: "base1", setName: "Base Set", number: "4", rarity: "Rare Holo", type: "Pokemon", imageUrl: "https://example.com/charizard.png" }];
    vi.mocked(platform.storage.cardRepository.findAll).mockResolvedValue(cards);

    const { result } = renderHook(() => usePHashIndexBuild());
    await waitFor(() => expect(result.current.isBuilding).toBe(false));

    expect(buildPHashIndex).toHaveBeenCalledWith(
      cards,
      platform.storage.pHashIndexRepository,
      expect.any(Function),
    );
  });
});
