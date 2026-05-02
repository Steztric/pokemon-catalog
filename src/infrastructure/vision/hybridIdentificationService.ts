import type { ICardIdentificationService, IPokemonCardDataProvider } from "../../domain/interfaces";
import type { ImageFrame, IdentificationResult } from "../../domain/entities";
import type { AnthropicVisionClient } from "./anthropicVisionClient";

export class HybridIdentificationService implements ICardIdentificationService {
  constructor(
    private readonly local: ICardIdentificationService,
    private readonly llm: AnthropicVisionClient | null,
    private readonly cardDataProvider: IPokemonCardDataProvider,
  ) {}

  async identify(frame: ImageFrame): Promise<IdentificationResult> {
    console.log("[hybrid] running local pHash…");
    const localResult = await this.local.identify(frame);
    console.log(`[hybrid] local result: status=${localResult.status} cardId=${localResult.cardId ?? "—"} conf=${localResult.confidence.toFixed(3)}`);

    if (localResult.status === "identified") {
      console.log("[hybrid] → identified via local_hash, skipping LLM");
      return localResult;
    }

    if (!this.llm) {
      console.log("[hybrid] no LLM client configured — returning local result");
      return localResult;
    }

    console.log("[hybrid] local low_confidence — calling LLM vision…");
    let llmResult: Awaited<ReturnType<AnthropicVisionClient["identifyCard"]>>;
    try {
      llmResult = await this.llm.identifyCard(frame);
    } catch (err) {
      console.log("[hybrid] LLM call threw:", err);
      return localResult;
    }

    if (!llmResult) {
      console.log("[hybrid] LLM returned null — returning local result");
      return localResult;
    }

    console.log(`[hybrid] LLM identified: cardName="${llmResult.cardName}" setName="${llmResult.setName}" cardNumber="${llmResult.cardNumber}"`);
    console.log(`[hybrid] searching cards for "${llmResult.cardName}"…`);

    let cards: Awaited<ReturnType<IPokemonCardDataProvider["searchCards"]>>;
    try {
      cards = await this.cardDataProvider.searchCards(llmResult.cardName);
    } catch (err) {
      console.log("[hybrid] searchCards threw:", err);
      return localResult;
    }

    console.log(`[hybrid] searchCards returned ${cards.length} results`);

    // Narrow to cards matching set name and card number from the LLM response
    const exact = cards.filter(
      (c) =>
        c.setName.toLowerCase() === llmResult!.setName.toLowerCase() &&
        c.number === llmResult!.cardNumber,
    );

    console.log(`[hybrid] exact matches (set+number filter): ${exact.length}`);

    if (exact.length === 1) {
      console.log(`[hybrid] → identified via llm_vision (${exact[0].id})`);
      return {
        status: "identified",
        cardId: exact[0].id,
        confidence: 0.85,
        strategy: "llm_vision",
      };
    }

    console.log("[hybrid] → low_confidence (no unique exact match)");
    return { ...localResult, strategy: "llm_vision" };
  }
}
