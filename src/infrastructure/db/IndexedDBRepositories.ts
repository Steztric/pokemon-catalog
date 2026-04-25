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
import type { IndexedDBDatabase } from "./IndexedDBDatabase";

export class IndexedDBCardRepository implements ICardRepository {
  constructor(private readonly db: Promise<IndexedDBDatabase>) {}

  async findById(id: string): Promise<PokemonCard | null> {
    return (await this.db).get<PokemonCard>("pokemon_cards", id);
  }

  async findAll(filter?: CardFilter): Promise<PokemonCard[]> {
    const all = await (await this.db).getAll<PokemonCard>("pokemon_cards");
    return all
      .filter((c) => {
        if (filter?.name && !c.name.toLowerCase().includes(filter.name.toLowerCase())) return false;
        if (filter?.setId && c.setId !== filter.setId) return false;
        if (filter?.rarity && c.rarity !== filter.rarity) return false;
        if (filter?.type && c.type !== filter.type) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async upsert(card: PokemonCard): Promise<void> {
    await (await this.db).put<PokemonCard>("pokemon_cards", card);
  }
}

export class IndexedDBCardSetRepository implements ICardSetRepository {
  constructor(private readonly db: Promise<IndexedDBDatabase>) {}

  async findById(id: string): Promise<CardSet | null> {
    return (await this.db).get<CardSet>("card_sets", id);
  }

  async findAll(): Promise<CardSet[]> {
    const all = await (await this.db).getAll<CardSet>("card_sets");
    return all.sort(
      (a, b) =>
        new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
    );
  }

  async upsert(set: CardSet): Promise<void> {
    await (await this.db).put<CardSet>("card_sets", set);
  }
}

export class IndexedDBCatalogRepository implements ICatalogRepository {
  constructor(private readonly db: Promise<IndexedDBDatabase>) {}

  async findByCardId(cardId: string): Promise<CatalogEntry | null> {
    const results = await (await this.db).getAllByIndex<CatalogEntry>(
      "catalog_entries",
      "by_card_id",
      cardId,
    );
    return results.length ? results[0] : null;
  }

  async findAll(filter?: CatalogFilter): Promise<CatalogEntry[]> {
    const all = await (await this.db).getAll<CatalogEntry>("catalog_entries");
    // Filtering by card metadata (name, setId, rarity, type) requires joining
    // with the cards store; that join is performed by the SearchCatalog use case
    // in Phase 5. Here we only support sorting.
    const sortDir = filter?.sortDir === "desc" ? -1 : 1;
    return all.sort((a, b) => {
      const aTime = new Date(a.firstAddedAt).getTime();
      const bTime = new Date(b.firstAddedAt).getTime();
      return (aTime - bTime) * sortDir;
    });
  }

  async save(entry: CatalogEntry): Promise<void> {
    await (await this.db).put<CatalogEntry>("catalog_entries", entry);
  }

  async incrementQuantity(cardId: string): Promise<void> {
    const db = await this.db;
    const entry = await this.findByCardId(cardId);
    if (!entry) return;
    await db.put<CatalogEntry>("catalog_entries", {
      ...entry,
      quantity: entry.quantity + 1,
    });
  }
}

export class IndexedDBScanEventRepository implements IScanEventRepository {
  constructor(private readonly db: Promise<IndexedDBDatabase>) {}

  async save(event: ScanEvent): Promise<void> {
    await (await this.db).put<ScanEvent>("scan_events", event);
  }

  async findBySession(sessionId: string): Promise<ScanEvent[]> {
    const events = await (await this.db).getAllByIndex<ScanEvent>(
      "scan_events",
      "by_session_id",
      sessionId,
    );
    return events.sort(
      (a, b) =>
        new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime(),
    );
  }
}

export class IndexedDBScanSessionRepository implements IScanSessionRepository {
  constructor(private readonly db: Promise<IndexedDBDatabase>) {}

  async save(session: ScanSession): Promise<void> {
    await (await this.db).put<ScanSession>("scan_sessions", session);
  }

  async findById(id: string): Promise<ScanSession | null> {
    return (await this.db).get<ScanSession>("scan_sessions", id);
  }

  async update(session: ScanSession): Promise<void> {
    await (await this.db).put<ScanSession>("scan_sessions", session);
  }
}
