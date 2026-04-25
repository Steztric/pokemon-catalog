import { describe, it, expect, vi } from "vitest";
import { CachingCardDataProvider } from "../../infrastructure/api/CachingCardDataProvider";
import type { IPokemonCardDataProvider, ICardRepository, ICardSetRepository } from "../../domain/interfaces";
import type { PokemonCard, CardSet } from "../../domain/entities";

const CARD: PokemonCard = {
  id: "base1-4",
  name: "Charizard",
  setId: "base1",
  setName: "Base Set",
  number: "4",
  rarity: "Rare Holo",
  type: "Pokemon",
  imageUrl: "https://img/large.png",
};

const CARD_SET: CardSet = {
  id: "base1",
  name: "Base Set",
  series: "Base",
  releaseDate: "1998/12/18",
  total: 102,
};

function makeInner(): IPokemonCardDataProvider {
  return {
    getCard: vi.fn().mockResolvedValue(CARD),
    getSet: vi.fn().mockResolvedValue(CARD_SET),
    searchCards: vi.fn().mockResolvedValue([CARD]),
    getAllSets: vi.fn().mockResolvedValue([CARD_SET]),
  };
}

function makeCardRepo(stored: PokemonCard | null = null): ICardRepository {
  return {
    findById: vi.fn().mockResolvedValue(stored),
    findAll: vi.fn().mockResolvedValue([]),
    upsert: vi.fn().mockResolvedValue(undefined),
  };
}

function makeSetRepo(stored: CardSet | null = null): ICardSetRepository {
  return {
    findById: vi.fn().mockResolvedValue(stored),
    findAll: vi.fn().mockResolvedValue([]),
    upsert: vi.fn().mockResolvedValue(undefined),
  };
}

describe("CachingCardDataProvider.getCard", () => {
  it("calls the inner provider and upserts the result on a cache miss", async () => {
    const inner = makeInner();
    const cardRepo = makeCardRepo(null);
    const provider = new CachingCardDataProvider(inner, cardRepo, makeSetRepo());

    const card = await provider.getCard("base1-4");

    expect(inner.getCard).toHaveBeenCalledOnce();
    expect(cardRepo.upsert).toHaveBeenCalledWith(CARD);
    expect(card).toEqual(CARD);
  });

  it("returns the cached card and skips the network on a cache hit", async () => {
    const inner = makeInner();
    const cardRepo = makeCardRepo(CARD);
    const provider = new CachingCardDataProvider(inner, cardRepo, makeSetRepo());

    const card = await provider.getCard("base1-4");

    expect(inner.getCard).not.toHaveBeenCalled();
    expect(card).toEqual(CARD);
  });

  it("does not upsert when returning from cache", async () => {
    const inner = makeInner();
    const cardRepo = makeCardRepo(CARD);
    const provider = new CachingCardDataProvider(inner, cardRepo, makeSetRepo());

    await provider.getCard("base1-4");

    expect(cardRepo.upsert).not.toHaveBeenCalled();
  });
});

describe("CachingCardDataProvider.getSet", () => {
  it("calls the inner provider and upserts the result on a cache miss", async () => {
    const inner = makeInner();
    const setRepo = makeSetRepo(null);
    const provider = new CachingCardDataProvider(inner, makeCardRepo(), setRepo);

    const set = await provider.getSet("base1");

    expect(inner.getSet).toHaveBeenCalledOnce();
    expect(setRepo.upsert).toHaveBeenCalledWith(CARD_SET);
    expect(set).toEqual(CARD_SET);
  });

  it("returns the cached set and skips the network on a cache hit", async () => {
    const inner = makeInner();
    const setRepo = makeSetRepo(CARD_SET);
    const provider = new CachingCardDataProvider(inner, makeCardRepo(), setRepo);

    const set = await provider.getSet("base1");

    expect(inner.getSet).not.toHaveBeenCalled();
    expect(set).toEqual(CARD_SET);
  });
});

describe("CachingCardDataProvider.searchCards", () => {
  it("always calls the inner provider", async () => {
    const inner = makeInner();
    const cardRepo = makeCardRepo();
    const provider = new CachingCardDataProvider(inner, cardRepo, makeSetRepo());

    const results = await provider.searchCards("Charizard");

    expect(inner.searchCards).toHaveBeenCalledWith("Charizard");
    expect(results).toEqual([CARD]);
  });

  it("upserts each returned card into the repository", async () => {
    const inner = makeInner();
    const cardRepo = makeCardRepo();
    const provider = new CachingCardDataProvider(inner, cardRepo, makeSetRepo());

    await provider.searchCards("Charizard");

    expect(cardRepo.upsert).toHaveBeenCalledWith(CARD);
  });
});

describe("CachingCardDataProvider.getAllSets", () => {
  it("always calls the inner provider", async () => {
    const inner = makeInner();
    const setRepo = makeSetRepo();
    const provider = new CachingCardDataProvider(inner, makeCardRepo(), setRepo);

    const results = await provider.getAllSets();

    expect(inner.getAllSets).toHaveBeenCalledOnce();
    expect(results).toEqual([CARD_SET]);
  });

  it("upserts each returned set into the repository", async () => {
    const inner = makeInner();
    const setRepo = makeSetRepo();
    const provider = new CachingCardDataProvider(inner, makeCardRepo(), setRepo);

    await provider.getAllSets();

    expect(setRepo.upsert).toHaveBeenCalledWith(CARD_SET);
  });
});
