import { describe, it, expect, beforeEach } from "vitest";
import { buildPHashIndex } from "../../infrastructure/vision/pHashIndexBuilder";
import { StubPHashIndexRepository } from "../../infrastructure/db/StubRepositories";
import type { PokemonCard, ImageFrame } from "../../domain/entities";

const CARD_A: PokemonCard = {
  id: "base1-4",
  name: "Charizard",
  setId: "base1",
  setName: "Base Set",
  number: "4",
  rarity: "Rare Holo",
  type: "Pokemon",
  imageUrl: "https://example.com/charizard.png",
};

const CARD_B: PokemonCard = {
  id: "base1-25",
  name: "Pikachu",
  setId: "base1",
  setName: "Base Set",
  number: "25",
  rarity: "Common",
  type: "Pokemon",
  imageUrl: "https://example.com/pikachu.png",
};

function fakeLoader(urlMap: Record<string, ImageFrame | null>) {
  return async (url: string): Promise<ImageFrame | null> => urlMap[url] ?? null;
}

function testFrame(v: number): ImageFrame {
  const data = new Uint8ClampedArray(64 * 64 * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i + 1] = data[i + 2] = v; data[i + 3] = 255;
  }
  return { data, width: 64, height: 64, capturedAt: new Date() };
}

describe("buildPHashIndex", () => {
  let repo: StubPHashIndexRepository;

  beforeEach(() => {
    repo = new StubPHashIndexRepository();
  });

  it("indexes new cards and returns the count", async () => {
    const loader = fakeLoader({
      [CARD_A.imageUrl]: testFrame(200),
      [CARD_B.imageUrl]: testFrame(100),
    });
    const { indexed, skipped } = await buildPHashIndex([CARD_A, CARD_B], repo, loader);
    expect(indexed).toBe(2);
    expect(skipped).toBe(0);
    expect(await repo.count()).toBe(2);
  });

  it("skips cards already in the index", async () => {
    const firstLoader = fakeLoader({ [CARD_A.imageUrl]: testFrame(200) });
    await buildPHashIndex([CARD_A], repo, firstLoader);

    // Second run: CARD_A already indexed, CARD_B now has an image available
    const secondLoader = fakeLoader({
      [CARD_A.imageUrl]: testFrame(200),
      [CARD_B.imageUrl]: testFrame(100),
    });
    const { indexed, skipped } = await buildPHashIndex([CARD_A, CARD_B], repo, secondLoader);
    expect(indexed).toBe(1); // only CARD_B is new
    expect(skipped).toBe(1); // CARD_A already indexed
  });

  it("skips cards whose image cannot be loaded", async () => {
    const loader = fakeLoader({ [CARD_A.imageUrl]: null });
    const { indexed, skipped } = await buildPHashIndex([CARD_A], repo, loader);
    expect(indexed).toBe(0);
    expect(skipped).toBe(1);
    expect(await repo.count()).toBe(0);
  });

  it("is idempotent when run twice on the same cards", async () => {
    const loader = fakeLoader({ [CARD_A.imageUrl]: testFrame(150) });
    await buildPHashIndex([CARD_A], repo, loader);
    await buildPHashIndex([CARD_A], repo, loader);
    expect(await repo.count()).toBe(1);
  });
});
