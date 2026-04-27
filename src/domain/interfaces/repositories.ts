import type {
  PokemonCard,
  CardSet,
  CatalogEntry,
  ScanEvent,
  ScanSession,
  CardFilter,
  CatalogFilter,
  PHashEntry,
} from "../entities";

export interface ICardRepository {
  findById(id: string): Promise<PokemonCard | null>;
  findAll(filter?: CardFilter): Promise<PokemonCard[]>;
  upsert(card: PokemonCard): Promise<void>;
}

export interface ICardSetRepository {
  findById(id: string): Promise<CardSet | null>;
  findAll(): Promise<CardSet[]>;
  upsert(set: CardSet): Promise<void>;
}

export interface ICatalogRepository {
  findByCardId(cardId: string): Promise<CatalogEntry | null>;
  findAll(filter?: CatalogFilter): Promise<CatalogEntry[]>;
  save(entry: CatalogEntry): Promise<void>;
  incrementQuantity(cardId: string): Promise<void>;
}

export interface IScanEventRepository {
  save(event: ScanEvent): Promise<void>;
  findBySession(sessionId: string): Promise<ScanEvent[]>;
}

export interface IScanSessionRepository {
  save(session: ScanSession): Promise<void>;
  findById(id: string): Promise<ScanSession | null>;
  update(session: ScanSession): Promise<void>;
}

export interface IPHashIndexRepository {
  findAll(): Promise<PHashEntry[]>;
  upsert(entry: PHashEntry): Promise<void>;
  hasCard(cardId: string): Promise<boolean>;
  count(): Promise<number>;
}
