import type { IPokemonCardDataProvider, ICardRepository, ICardSetRepository } from "../../domain/interfaces";
import type { PokemonCard, CardSet } from "../../domain/entities";

export class CachingCardDataProvider implements IPokemonCardDataProvider {
  constructor(
    private readonly inner: IPokemonCardDataProvider,
    private readonly cardRepo: ICardRepository,
    private readonly setRepo: ICardSetRepository,
  ) {}

  async getCard(id: string): Promise<PokemonCard> {
    const cached = await this.cardRepo.findById(id);
    if (cached) return cached;
    const card = await this.inner.getCard(id);
    await this.cardRepo.upsert(card);
    return card;
  }

  async getSet(id: string): Promise<CardSet> {
    const cached = await this.setRepo.findById(id);
    if (cached) return cached;
    const set = await this.inner.getSet(id);
    await this.setRepo.upsert(set);
    return set;
  }

  // Search results are always fetched live; individual cards are cached as a side-effect.
  async searchCards(query: string): Promise<PokemonCard[]> {
    const cards = await this.inner.searchCards(query);
    await Promise.all(cards.map((c) => this.cardRepo.upsert(c)));
    return cards;
  }

  // Set listings are always fetched live; individual sets are cached as a side-effect.
  async getAllSets(): Promise<CardSet[]> {
    const sets = await this.inner.getAllSets();
    await Promise.all(sets.map((s) => this.setRepo.upsert(s)));
    return sets;
  }
}
