import { describe, it, expect, vi } from "vitest";
import { HybridIdentificationService } from "../../infrastructure/vision/hybridIdentificationService";
import { StubPokemonCardDataProvider } from "../../infrastructure/api/StubPokemonCardDataProvider";
import type { ICardIdentificationService, IPokemonCardDataProvider } from "../../domain/interfaces";
import type { ImageFrame, IdentificationResult } from "../../domain/entities";
import type { AnthropicVisionClient, LLMCardIdentification } from "../../infrastructure/vision/anthropicVisionClient";

const frame: ImageFrame = {
  data: new Uint8ClampedArray(4),
  width: 1,
  height: 1,
  capturedAt: new Date(),
};

function mockLocal(result: IdentificationResult): ICardIdentificationService {
  return { identify: vi.fn().mockResolvedValue(result) };
}

function mockLLM(result: LLMCardIdentification | null): Pick<AnthropicVisionClient, "identifyCard"> {
  return { identifyCard: vi.fn().mockResolvedValue(result) };
}

const identified: IdentificationResult = {
  status: "identified",
  cardId: "base1-4",
  confidence: 0.95,
  strategy: "local_hash",
};

const lowConf: IdentificationResult = {
  status: "low_confidence",
  confidence: 0.3,
  strategy: "local_hash",
};

describe("HybridIdentificationService", () => {
  describe("when local identifies the card", () => {
    it("returns the local result without calling the LLM", async () => {
      const llm = mockLLM({ cardName: "Charizard", setName: "Base Set", cardNumber: "4" });
      const service = new HybridIdentificationService(
        mockLocal(identified),
        llm as unknown as AnthropicVisionClient,
        new StubPokemonCardDataProvider(),
      );
      const result = await service.identify(frame);
      expect(result).toBe(identified);
      expect(llm.identifyCard).not.toHaveBeenCalled();
    });
  });

  describe("when local returns low_confidence", () => {
    it("returns low_confidence when no LLM client is configured", async () => {
      const service = new HybridIdentificationService(
        mockLocal(lowConf),
        null,
        new StubPokemonCardDataProvider(),
      );
      expect((await service.identify(frame)).status).toBe("low_confidence");
    });

    it("identifies via llm_vision when LLM resolves to a unique card", async () => {
      const llm = mockLLM({ cardName: "Charizard", setName: "Base Set", cardNumber: "4" });
      const service = new HybridIdentificationService(
        mockLocal(lowConf),
        llm as unknown as AnthropicVisionClient,
        new StubPokemonCardDataProvider(),
      );
      const result = await service.identify(frame);
      expect(result.status).toBe("identified");
      expect(result.cardId).toBe("base1-4");
      expect(result.strategy).toBe("llm_vision");
      expect(result.confidence).toBe(0.85);
    });

    it("returns low_confidence when LLM set+number matches no card", async () => {
      const llm = mockLLM({ cardName: "Charizard", setName: "Wrong Set", cardNumber: "99" });
      const service = new HybridIdentificationService(
        mockLocal(lowConf),
        llm as unknown as AnthropicVisionClient,
        new StubPokemonCardDataProvider(),
      );
      expect((await service.identify(frame)).status).toBe("low_confidence");
    });

    it("returns low_confidence when LLM matches multiple cards (ambiguous)", async () => {
      const provider: IPokemonCardDataProvider = {
        searchCards: vi.fn().mockResolvedValue([
          { id: "set1-10", name: "Pikachu", setId: "set1", setName: "Jungle", number: "60", rarity: "Common", type: "Pokemon", imageUrl: "" },
          { id: "set2-10", name: "Pikachu", setId: "set2", setName: "Jungle", number: "60", rarity: "Common", type: "Pokemon", imageUrl: "" },
        ]),
        getCard: vi.fn(),
        getSet: vi.fn(),
        getAllSets: vi.fn(),
      };
      const llm = mockLLM({ cardName: "Pikachu", setName: "Jungle", cardNumber: "60" });
      const service = new HybridIdentificationService(
        mockLocal(lowConf),
        llm as unknown as AnthropicVisionClient,
        provider,
      );
      expect((await service.identify(frame)).status).toBe("low_confidence");
    });

    it("returns low_confidence when LLM returns null", async () => {
      const llm = mockLLM(null);
      const service = new HybridIdentificationService(
        mockLocal(lowConf),
        llm as unknown as AnthropicVisionClient,
        new StubPokemonCardDataProvider(),
      );
      expect((await service.identify(frame)).status).toBe("low_confidence");
    });

    it("returns low_confidence when the LLM call throws", async () => {
      const llm = { identifyCard: vi.fn().mockRejectedValue(new Error("timeout")) };
      const service = new HybridIdentificationService(
        mockLocal(lowConf),
        llm as unknown as AnthropicVisionClient,
        new StubPokemonCardDataProvider(),
      );
      expect((await service.identify(frame)).status).toBe("low_confidence");
    });

    it("returns low_confidence when the card search throws", async () => {
      const provider: IPokemonCardDataProvider = {
        searchCards: vi.fn().mockRejectedValue(new Error("network")),
        getCard: vi.fn(),
        getSet: vi.fn(),
        getAllSets: vi.fn(),
      };
      const llm = mockLLM({ cardName: "Charizard", setName: "Base Set", cardNumber: "4" });
      const service = new HybridIdentificationService(
        mockLocal(lowConf),
        llm as unknown as AnthropicVisionClient,
        provider,
      );
      expect((await service.identify(frame)).status).toBe("low_confidence");
    });
  });
});
