import { describe, it, expect } from "vitest";
import type {
  PokemonCard,
  CardSet,
  CatalogEntry,
  ScanEvent,
  ScanSession,
  CardFilter,
  CatalogFilter,
  ImageFrame,
  IdentificationResult,
  CardType,
} from "../../domain/entities";

describe("PokemonCard", () => {
  it("accepts all three CardType values", () => {
    const types: CardType[] = ["Pokemon", "Trainer", "Energy"];
    const cards: PokemonCard[] = types.map((type, i) => ({
      id: `test-${i}`,
      name: "Test Card",
      setId: "base1",
      setName: "Base Set",
      number: String(i + 1),
      rarity: "Common",
      type,
      imageUrl: "https://example.com/card.png",
    }));
    expect(cards.map((c) => c.type)).toEqual(["Pokemon", "Trainer", "Energy"]);
  });

  it("has all required fields", () => {
    const card: PokemonCard = {
      id: "base1-4",
      name: "Charizard",
      setId: "base1",
      setName: "Base Set",
      number: "4",
      rarity: "Rare Holo",
      type: "Pokemon",
      imageUrl: "https://images.pokemontcg.io/base1/4_hires.png",
    };
    expect(card.id).toBe("base1-4");
    expect(card.name).toBe("Charizard");
    expect(card.setId).toBe("base1");
    expect(card.type).toBe("Pokemon");
  });
});

describe("CardSet", () => {
  it("has all required fields", () => {
    const set: CardSet = {
      id: "base1",
      name: "Base Set",
      series: "Base",
      releaseDate: "1998/12/18",
      total: 102,
    };
    expect(set.id).toBe("base1");
    expect(set.total).toBe(102);
  });
});

describe("CatalogEntry", () => {
  it("has all required fields", () => {
    const entry: CatalogEntry = {
      id: "entry-1",
      cardId: "base1-4",
      quantity: 2,
      firstAddedAt: new Date("2026-01-01"),
    };
    expect(entry.cardId).toBe("base1-4");
    expect(entry.quantity).toBe(2);
    expect(entry.firstAddedAt).toBeInstanceOf(Date);
  });
});

describe("ScanEvent", () => {
  it("has all required fields", () => {
    const event: ScanEvent = {
      id: "event-1",
      cardId: "base1-4",
      scannedAt: new Date(),
      sessionId: "session-1",
      confirmed: true,
    };
    expect(event.confirmed).toBe(true);
    expect(event.sessionId).toBe("session-1");
  });
});

describe("ScanSession", () => {
  it("allows null endedAt for an active session", () => {
    const session: ScanSession = {
      id: "session-1",
      startedAt: new Date(),
      endedAt: null,
      cardsScanned: 0,
    };
    expect(session.endedAt).toBeNull();
  });

  it("allows a Date endedAt for a completed session", () => {
    const session: ScanSession = {
      id: "session-2",
      startedAt: new Date("2026-01-01T10:00:00Z"),
      endedAt: new Date("2026-01-01T10:30:00Z"),
      cardsScanned: 5,
    };
    expect(session.endedAt).toBeInstanceOf(Date);
    expect(session.cardsScanned).toBe(5);
  });
});

describe("CardFilter", () => {
  it("allows all fields to be optional", () => {
    const empty: CardFilter = {};
    const full: CardFilter = { name: "Pikachu", setId: "base1", rarity: "Common", type: "Pokemon" };
    expect(empty).toEqual({});
    expect(full.name).toBe("Pikachu");
  });
});

describe("CatalogFilter", () => {
  it("supports all sort options", () => {
    const filters: CatalogFilter[] = [
      { sortBy: "name", sortDir: "asc" },
      { sortBy: "set", sortDir: "desc" },
      { sortBy: "number" },
      { sortBy: "rarity" },
      { sortBy: "firstAddedAt" },
    ];
    expect(filters[0].sortBy).toBe("name");
    expect(filters[1].sortDir).toBe("desc");
  });
});

describe("ImageFrame", () => {
  it("has all required fields", () => {
    const frame: ImageFrame = {
      data: new Uint8ClampedArray(4),
      width: 640,
      height: 480,
      capturedAt: new Date(),
    };
    expect(frame.width).toBe(640);
    expect(frame.data).toBeInstanceOf(Uint8ClampedArray);
  });
});

describe("IdentificationResult", () => {
  it("represents an identified card", () => {
    const result: IdentificationResult = {
      status: "identified",
      cardId: "base1-4",
      confidence: 0.95,
      strategy: "local_hash",
    };
    expect(result.status).toBe("identified");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("represents a not_a_card result without cardId", () => {
    const result: IdentificationResult = {
      status: "not_a_card",
      confidence: 0,
      strategy: "local_hash",
    };
    expect(result.cardId).toBeUndefined();
  });

  it("represents a low_confidence result from llm_vision", () => {
    const result: IdentificationResult = {
      status: "low_confidence",
      cardId: "base1-25",
      confidence: 0.4,
      strategy: "llm_vision",
    };
    expect(result.strategy).toBe("llm_vision");
  });
});
