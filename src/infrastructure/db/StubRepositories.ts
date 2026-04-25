import type {
  ICardRepository,
  ICardSetRepository,
  ICatalogRepository,
  IScanEventRepository,
  IScanSessionRepository,
} from "../../domain/interfaces";
import type {
  PokemonCard,
  CardSet,
  CatalogEntry,
  ScanEvent,
  ScanSession,
  CardFilter,
  CatalogFilter,
} from "../../domain/entities";

export class StubCardRepository implements ICardRepository {
  async findById(_id: string): Promise<PokemonCard | null> {
    return null;
  }
  async findAll(_filter?: CardFilter): Promise<PokemonCard[]> {
    return [];
  }
  async upsert(_card: PokemonCard): Promise<void> {}
}

export class StubCardSetRepository implements ICardSetRepository {
  async findById(_id: string): Promise<CardSet | null> {
    return null;
  }
  async findAll(): Promise<CardSet[]> {
    return [];
  }
  async upsert(_set: CardSet): Promise<void> {}
}

export class StubCatalogRepository implements ICatalogRepository {
  async findByCardId(_cardId: string): Promise<CatalogEntry | null> {
    return null;
  }
  async findAll(_filter?: CatalogFilter): Promise<CatalogEntry[]> {
    return [];
  }
  async save(_entry: CatalogEntry): Promise<void> {}
  async incrementQuantity(_cardId: string): Promise<void> {}
}

export class StubScanEventRepository implements IScanEventRepository {
  async save(_event: ScanEvent): Promise<void> {}
  async findBySession(_sessionId: string): Promise<ScanEvent[]> {
    return [];
  }
}

export class StubScanSessionRepository implements IScanSessionRepository {
  async save(_session: ScanSession): Promise<void> {}
  async findById(_id: string): Promise<ScanSession | null> {
    return null;
  }
  async update(_session: ScanSession): Promise<void> {}
}
