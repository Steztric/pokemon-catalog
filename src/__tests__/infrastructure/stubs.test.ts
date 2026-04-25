import { describe, it, expect } from "vitest";
import {
  StubCardRepository,
  StubCardSetRepository,
  StubCatalogRepository,
  StubScanEventRepository,
  StubScanSessionRepository,
} from "../../infrastructure/db/StubRepositories";
import { StubPokemonCardDataProvider } from "../../infrastructure/api/StubPokemonCardDataProvider";
import { StubCardIdentificationService } from "../../infrastructure/vision/StubCardIdentificationService";
import type { PokemonCard, CardSet, CatalogEntry, ScanEvent, ScanSession, ImageFrame } from "../../domain/entities";

const stubCard: PokemonCard = {
  id: "test-1",
  name: "Test",
  setId: "test",
  setName: "Test Set",
  number: "1",
  rarity: "Common",
  type: "Pokemon",
  imageUrl: "https://example.com/card.png",
};

const stubSet: CardSet = {
  id: "test",
  name: "Test Set",
  series: "Test",
  releaseDate: "2026/01/01",
  total: 10,
};

const stubEntry: CatalogEntry = {
  id: "entry-1",
  cardId: "test-1",
  quantity: 1,
  firstAddedAt: new Date(),
};

const stubScanEvent: ScanEvent = {
  id: "event-1",
  cardId: "test-1",
  scannedAt: new Date(),
  sessionId: "session-1",
  confirmed: true,
};

const stubSession: ScanSession = {
  id: "session-1",
  startedAt: new Date(),
  endedAt: null,
  cardsScanned: 0,
};

const stubFrame: ImageFrame = {
  data: new Uint8ClampedArray(4),
  width: 1,
  height: 1,
  capturedAt: new Date(),
};

describe("StubCardRepository", () => {
  const repo = new StubCardRepository();

  it("findById returns null", async () => {
    expect(await repo.findById("any")).toBeNull();
  });

  it("findAll returns empty array", async () => {
    expect(await repo.findAll()).toEqual([]);
  });

  it("findAll with filter returns empty array", async () => {
    expect(await repo.findAll({ name: "Pikachu" })).toEqual([]);
  });

  it("upsert resolves without error", async () => {
    await expect(repo.upsert(stubCard)).resolves.toBeUndefined();
  });
});

describe("StubCardSetRepository", () => {
  const repo = new StubCardSetRepository();

  it("findById returns null", async () => {
    expect(await repo.findById("any")).toBeNull();
  });

  it("findAll returns empty array", async () => {
    expect(await repo.findAll()).toEqual([]);
  });

  it("upsert resolves without error", async () => {
    await expect(repo.upsert(stubSet)).resolves.toBeUndefined();
  });
});

describe("StubCatalogRepository", () => {
  const repo = new StubCatalogRepository();

  it("findByCardId returns null", async () => {
    expect(await repo.findByCardId("any")).toBeNull();
  });

  it("findAll returns empty array", async () => {
    expect(await repo.findAll()).toEqual([]);
  });

  it("save resolves without error", async () => {
    await expect(repo.save(stubEntry)).resolves.toBeUndefined();
  });

  it("incrementQuantity resolves without error", async () => {
    await expect(repo.incrementQuantity("any")).resolves.toBeUndefined();
  });
});

describe("StubScanEventRepository", () => {
  const repo = new StubScanEventRepository();

  it("save resolves without error", async () => {
    await expect(repo.save(stubScanEvent)).resolves.toBeUndefined();
  });

  it("findBySession returns empty array", async () => {
    expect(await repo.findBySession("session-1")).toEqual([]);
  });
});

describe("StubScanSessionRepository", () => {
  const repo = new StubScanSessionRepository();

  it("save resolves without error", async () => {
    await expect(repo.save(stubSession)).resolves.toBeUndefined();
  });

  it("findById returns null", async () => {
    expect(await repo.findById("any")).toBeNull();
  });

  it("update resolves without error", async () => {
    await expect(repo.update(stubSession)).resolves.toBeUndefined();
  });
});

describe("StubPokemonCardDataProvider", () => {
  const provider = new StubPokemonCardDataProvider();

  it("getCard returns a known card", async () => {
    const card = await provider.getCard("base1-4");
    expect(card.name).toBe("Charizard");
    expect(card.type).toBe("Pokemon");
  });

  it("getCard throws for unknown id", async () => {
    await expect(provider.getCard("unknown")).rejects.toThrow();
  });

  it("getSet returns a known set", async () => {
    const set = await provider.getSet("base1");
    expect(set.name).toBe("Base Set");
  });

  it("getSet throws for unknown id", async () => {
    await expect(provider.getSet("unknown")).rejects.toThrow();
  });

  it("searchCards filters by name case-insensitively", async () => {
    const results = await provider.searchCards("pikachu");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Pikachu");
  });

  it("searchCards returns empty array for no match", async () => {
    expect(await provider.searchCards("Mewtwo")).toEqual([]);
  });

  it("getAllSets returns all stub sets", async () => {
    const sets = await provider.getAllSets();
    expect(sets.length).toBeGreaterThan(0);
    expect(sets[0].id).toBe("base1");
  });
});

describe("StubCardIdentificationService", () => {
  const service = new StubCardIdentificationService();

  it("identify returns not_a_card with zero confidence", async () => {
    const result = await service.identify(stubFrame);
    expect(result.status).toBe("not_a_card");
    expect(result.confidence).toBe(0);
    expect(result.strategy).toBe("local_hash");
  });
});
