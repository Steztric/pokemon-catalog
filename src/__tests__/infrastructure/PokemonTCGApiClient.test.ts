import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PokemonTCGApiClient } from "../../infrastructure/api/PokemonTCGApiClient";

const API_CARD = {
  id: "base1-4",
  name: "Charizard",
  number: "4",
  rarity: "Rare Holo",
  supertype: "Pokémon",
  set: { id: "base1", name: "Base Set", series: "Base", releaseDate: "1998/12/18", total: 102 },
  images: { small: "https://img/small.png", large: "https://img/large.png" },
};

const API_SET = {
  id: "base1",
  name: "Base Set",
  series: "Base",
  releaseDate: "1998/12/18",
  total: 102,
};

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch({ data: API_CARD }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PokemonTCGApiClient.getCard", () => {
  it("maps a card response to a PokemonCard", async () => {
    vi.stubGlobal("fetch", mockFetch({ data: API_CARD }));
    const client = new PokemonTCGApiClient();
    const card = await client.getCard("base1-4");
    expect(card.id).toBe("base1-4");
    expect(card.name).toBe("Charizard");
    expect(card.type).toBe("Pokemon");
    expect(card.imageUrl).toBe("https://img/large.png");
    expect(card.setId).toBe("base1");
  });

  it("fetches the correct URL", async () => {
    const fetchSpy = mockFetch({ data: API_CARD });
    vi.stubGlobal("fetch", fetchSpy);
    const client = new PokemonTCGApiClient();
    await client.getCard("base1-4");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.pokemontcg.io/v2/cards/base1-4",
      expect.anything(),
    );
  });

  it("sends X-Api-Key header when an API key is provided", async () => {
    const fetchSpy = mockFetch({ data: API_CARD });
    vi.stubGlobal("fetch", fetchSpy);
    const client = new PokemonTCGApiClient("test-key-123");
    await client.getCard("base1-4");
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["X-Api-Key"]).toBe("test-key-123");
  });

  it("sends no X-Api-Key header when no API key is provided", async () => {
    vi.stubEnv("VITE_POKEMON_TCG_API_KEY", "");
    const fetchSpy = mockFetch({ data: API_CARD });
    vi.stubGlobal("fetch", fetchSpy);
    const client = new PokemonTCGApiClient(undefined);
    await client.getCard("base1-4");
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["X-Api-Key"]).toBeUndefined();
    vi.unstubAllEnvs();
  });

  it("throws on a non-200 response", async () => {
    vi.stubGlobal("fetch", mockFetch({ message: "Not Found" }, 404));
    const client = new PokemonTCGApiClient();
    await expect(client.getCard("bad-id")).rejects.toThrow("404");
  });

  it("defaults missing rarity to Unknown", async () => {
    const cardWithoutRarity = { ...API_CARD, rarity: undefined };
    vi.stubGlobal("fetch", mockFetch({ data: cardWithoutRarity }));
    const client = new PokemonTCGApiClient();
    const card = await client.getCard("base1-4");
    expect(card.rarity).toBe("Unknown");
  });
});

describe("PokemonTCGApiClient supertype mapping", () => {
  it.each([
    ["Pokémon", "Pokemon"],
    ["Trainer", "Trainer"],
    ["Energy", "Energy"],
    ["Unknown", "Trainer"],
  ])('maps supertype "%s" to CardType "%s"', async (supertype, expected) => {
    vi.stubGlobal("fetch", mockFetch({ data: { ...API_CARD, supertype } }));
    const client = new PokemonTCGApiClient();
    const card = await client.getCard("x");
    expect(card.type).toBe(expected);
  });
});

describe("PokemonTCGApiClient.getSet", () => {
  it("maps a set response to a CardSet", async () => {
    vi.stubGlobal("fetch", mockFetch({ data: API_SET }));
    const client = new PokemonTCGApiClient();
    const set = await client.getSet("base1");
    expect(set.id).toBe("base1");
    expect(set.name).toBe("Base Set");
    expect(set.total).toBe(102);
  });

  it("fetches the correct URL", async () => {
    const fetchSpy = mockFetch({ data: API_SET });
    vi.stubGlobal("fetch", fetchSpy);
    const client = new PokemonTCGApiClient();
    await client.getSet("base1");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.pokemontcg.io/v2/sets/base1",
      expect.anything(),
    );
  });

  it("throws on a non-200 response", async () => {
    vi.stubGlobal("fetch", mockFetch({}, 500));
    const client = new PokemonTCGApiClient();
    await expect(client.getSet("bad-id")).rejects.toThrow("500");
  });
});

describe("PokemonTCGApiClient.searchCards", () => {
  it("returns an array of mapped cards", async () => {
    vi.stubGlobal("fetch", mockFetch({ data: [API_CARD] }));
    const client = new PokemonTCGApiClient();
    const results = await client.searchCards("Charizard");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Charizard");
  });

  it("encodes the query and uses wildcard name matching", async () => {
    const fetchSpy = mockFetch({ data: [] });
    vi.stubGlobal("fetch", fetchSpy);
    const client = new PokemonTCGApiClient();
    await client.searchCards("Pika chu");
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toContain("name%3A");
    expect(url).toContain("Pika%20chu");
  });

  it("returns an empty array when no cards match", async () => {
    vi.stubGlobal("fetch", mockFetch({ data: [] }));
    const client = new PokemonTCGApiClient();
    expect(await client.searchCards("Mewtwo99")).toEqual([]);
  });
});

describe("PokemonTCGApiClient.getAllSets", () => {
  it("returns an array of mapped sets", async () => {
    vi.stubGlobal("fetch", mockFetch({ data: [API_SET] }));
    const client = new PokemonTCGApiClient();
    const sets = await client.getAllSets();
    expect(sets).toHaveLength(1);
    expect(sets[0].id).toBe("base1");
  });

  it("fetches with pageSize=250", async () => {
    const fetchSpy = mockFetch({ data: [] });
    vi.stubGlobal("fetch", fetchSpy);
    const client = new PokemonTCGApiClient();
    await client.getAllSets();
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toContain("pageSize=250");
  });
});
