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
  CardType,
} from "../../domain/entities";
import type { IDatabase } from "./IDatabase";

// ---------------------------------------------------------------------------
// Row types (SQLite snake_case → domain camelCase)
// ---------------------------------------------------------------------------

interface CardRow {
  id: string;
  name: string;
  set_id: string;
  set_name: string;
  number: string;
  rarity: string;
  type: string;
  image_url: string;
}

interface SetRow {
  id: string;
  name: string;
  series: string;
  release_date: string;
  total: number;
}

interface CatalogRow {
  id: string;
  card_id: string;
  quantity: number;
  first_added_at: string;
}

interface ScanEventRow {
  id: string;
  card_id: string;
  scanned_at: string;
  session_id: string;
  confirmed: number;
}

interface ScanSessionRow {
  id: string;
  started_at: string;
  ended_at: string | null;
  cards_scanned: number;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function rowToCard(r: CardRow): PokemonCard {
  return {
    id: r.id,
    name: r.name,
    setId: r.set_id,
    setName: r.set_name,
    number: r.number,
    rarity: r.rarity,
    type: r.type as CardType,
    imageUrl: r.image_url,
  };
}

function rowToSet(r: SetRow): CardSet {
  return {
    id: r.id,
    name: r.name,
    series: r.series,
    releaseDate: r.release_date,
    total: r.total,
  };
}

function rowToEntry(r: CatalogRow): CatalogEntry {
  return {
    id: r.id,
    cardId: r.card_id,
    quantity: r.quantity,
    firstAddedAt: new Date(r.first_added_at),
  };
}

function rowToEvent(r: ScanEventRow): ScanEvent {
  return {
    id: r.id,
    cardId: r.card_id,
    scannedAt: new Date(r.scanned_at),
    sessionId: r.session_id,
    confirmed: r.confirmed !== 0,
  };
}

function rowToSession(r: ScanSessionRow): ScanSession {
  return {
    id: r.id,
    startedAt: new Date(r.started_at),
    endedAt: r.ended_at ? new Date(r.ended_at) : null,
    cardsScanned: r.cards_scanned,
  };
}

// ---------------------------------------------------------------------------
// Repositories
// ---------------------------------------------------------------------------

export class SQLiteCardRepository implements ICardRepository {
  constructor(private readonly db: Promise<IDatabase>) {}

  async findById(id: string): Promise<PokemonCard | null> {
    const db = await this.db;
    const rows = await db.select<CardRow>(
      "SELECT * FROM pokemon_cards WHERE id = ?",
      [id],
    );
    return rows.length ? rowToCard(rows[0]) : null;
  }

  async findAll(filter?: CardFilter): Promise<PokemonCard[]> {
    const db = await this.db;
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filter?.name) {
      conditions.push("name LIKE ?");
      params.push(`%${filter.name}%`);
    }
    if (filter?.setId) {
      conditions.push("set_id = ?");
      params.push(filter.setId);
    }
    if (filter?.rarity) {
      conditions.push("rarity = ?");
      params.push(filter.rarity);
    }
    if (filter?.type) {
      conditions.push("type = ?");
      params.push(filter.type);
    }
    const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
    const rows = await db.select<CardRow>(
      `SELECT * FROM pokemon_cards${where} ORDER BY name`,
      params.length ? params : undefined,
    );
    return rows.map(rowToCard);
  }

  async upsert(card: PokemonCard): Promise<void> {
    const db = await this.db;
    await db.execute(
      `INSERT OR REPLACE INTO pokemon_cards
        (id, name, set_id, set_name, number, rarity, type, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        card.id,
        card.name,
        card.setId,
        card.setName,
        card.number,
        card.rarity,
        card.type,
        card.imageUrl,
      ],
    );
  }
}

export class SQLiteCardSetRepository implements ICardSetRepository {
  constructor(private readonly db: Promise<IDatabase>) {}

  async findById(id: string): Promise<CardSet | null> {
    const db = await this.db;
    const rows = await db.select<SetRow>(
      "SELECT * FROM card_sets WHERE id = ?",
      [id],
    );
    return rows.length ? rowToSet(rows[0]) : null;
  }

  async findAll(): Promise<CardSet[]> {
    const db = await this.db;
    const rows = await db.select<SetRow>(
      "SELECT * FROM card_sets ORDER BY release_date DESC",
    );
    return rows.map(rowToSet);
  }

  async upsert(set: CardSet): Promise<void> {
    const db = await this.db;
    await db.execute(
      `INSERT OR REPLACE INTO card_sets
        (id, name, series, release_date, total)
       VALUES (?, ?, ?, ?, ?)`,
      [set.id, set.name, set.series, set.releaseDate, set.total],
    );
  }
}

const SORT_COLUMNS: Record<NonNullable<CatalogFilter["sortBy"]>, string> = {
  name: 'COALESCE(pc.name, "")',
  set: 'COALESCE(pc.set_name, "")',
  number: 'COALESCE(pc.number, "")',
  rarity: 'COALESCE(pc.rarity, "")',
  firstAddedAt: "ce.first_added_at",
};

export class SQLiteCatalogRepository implements ICatalogRepository {
  constructor(private readonly db: Promise<IDatabase>) {}

  async findByCardId(cardId: string): Promise<CatalogEntry | null> {
    const db = await this.db;
    const rows = await db.select<CatalogRow>(
      "SELECT * FROM catalog_entries WHERE card_id = ?",
      [cardId],
    );
    return rows.length ? rowToEntry(rows[0]) : null;
  }

  async findAll(filter?: CatalogFilter): Promise<CatalogEntry[]> {
    const db = await this.db;
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filter?.name) {
      conditions.push("pc.name LIKE ?");
      params.push(`%${filter.name}%`);
    }
    if (filter?.setId) {
      conditions.push("pc.set_id = ?");
      params.push(filter.setId);
    }
    if (filter?.rarity) {
      conditions.push("pc.rarity = ?");
      params.push(filter.rarity);
    }
    if (filter?.type) {
      conditions.push("pc.type = ?");
      params.push(filter.type);
    }

    const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
    const sortCol = SORT_COLUMNS[filter?.sortBy ?? "firstAddedAt"];
    const sortDir = filter?.sortDir === "desc" ? "DESC" : "ASC";

    const rows = await db.select<CatalogRow>(
      `SELECT ce.id, ce.card_id, ce.quantity, ce.first_added_at
       FROM catalog_entries ce
       LEFT JOIN pokemon_cards pc ON ce.card_id = pc.id
       ${where}
       ORDER BY ${sortCol} ${sortDir}`,
      params.length ? params : undefined,
    );
    return rows.map(rowToEntry);
  }

  async save(entry: CatalogEntry): Promise<void> {
    const db = await this.db;
    await db.execute(
      `INSERT OR REPLACE INTO catalog_entries
        (id, card_id, quantity, first_added_at)
       VALUES (?, ?, ?, ?)`,
      [
        entry.id,
        entry.cardId,
        entry.quantity,
        entry.firstAddedAt.toISOString(),
      ],
    );
  }

  async incrementQuantity(cardId: string): Promise<void> {
    const db = await this.db;
    await db.execute(
      "UPDATE catalog_entries SET quantity = quantity + 1 WHERE card_id = ?",
      [cardId],
    );
  }
}

export class SQLiteScanEventRepository implements IScanEventRepository {
  constructor(private readonly db: Promise<IDatabase>) {}

  async save(event: ScanEvent): Promise<void> {
    const db = await this.db;
    await db.execute(
      `INSERT OR REPLACE INTO scan_events
        (id, card_id, scanned_at, session_id, confirmed)
       VALUES (?, ?, ?, ?, ?)`,
      [
        event.id,
        event.cardId,
        event.scannedAt.toISOString(),
        event.sessionId,
        event.confirmed ? 1 : 0,
      ],
    );
  }

  async findBySession(sessionId: string): Promise<ScanEvent[]> {
    const db = await this.db;
    const rows = await db.select<ScanEventRow>(
      "SELECT * FROM scan_events WHERE session_id = ? ORDER BY scanned_at",
      [sessionId],
    );
    return rows.map(rowToEvent);
  }
}

export class SQLiteScanSessionRepository implements IScanSessionRepository {
  constructor(private readonly db: Promise<IDatabase>) {}

  async save(session: ScanSession): Promise<void> {
    const db = await this.db;
    await db.execute(
      `INSERT OR REPLACE INTO scan_sessions
        (id, started_at, ended_at, cards_scanned)
       VALUES (?, ?, ?, ?)`,
      [
        session.id,
        session.startedAt.toISOString(),
        session.endedAt ? session.endedAt.toISOString() : null,
        session.cardsScanned,
      ],
    );
  }

  async findById(id: string): Promise<ScanSession | null> {
    const db = await this.db;
    const rows = await db.select<ScanSessionRow>(
      "SELECT * FROM scan_sessions WHERE id = ?",
      [id],
    );
    return rows.length ? rowToSession(rows[0]) : null;
  }

  async update(session: ScanSession): Promise<void> {
    const db = await this.db;
    await db.execute(
      `UPDATE scan_sessions
       SET started_at = ?, ended_at = ?, cards_scanned = ?
       WHERE id = ?`,
      [
        session.startedAt.toISOString(),
        session.endedAt ? session.endedAt.toISOString() : null,
        session.cardsScanned,
        session.id,
      ],
    );
  }
}
