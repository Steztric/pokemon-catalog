import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardList } from "../../presentation/components/CardList";
import type { CardDetail } from "../../application/usecases/GetCardDetail";

const ITEMS: CardDetail[] = [
  {
    card: {
      id: "base1-4",
      name: "Charizard",
      setId: "base1",
      setName: "Base Set",
      number: "4",
      rarity: "Rare Holo",
      type: "Pokemon",
      imageUrl: "https://example.com/charizard.png",
    },
    entry: { id: "e1", cardId: "base1-4", quantity: 2, firstAddedAt: new Date("2026-01-01T00:00:00Z") },
  },
];

describe("CardList", () => {
  it("renders table column headers", () => {
    render(<CardList items={ITEMS} />);
    expect(screen.getByText("Card")).toBeInTheDocument();
    expect(screen.getByText("Set")).toBeInTheDocument();
    expect(screen.getByText("Rarity")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Qty")).toBeInTheDocument();
    expect(screen.getByText("Added")).toBeInTheDocument();
  });

  it("renders card name and set name", () => {
    render(<CardList items={ITEMS} />);
    expect(screen.getByText("Charizard")).toBeInTheDocument();
    expect(screen.getByText("Base Set")).toBeInTheDocument();
  });

  it("renders quantity", () => {
    render(<CardList items={ITEMS} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders rarity and type", () => {
    render(<CardList items={ITEMS} />);
    expect(screen.getByText("Rare Holo")).toBeInTheDocument();
    expect(screen.getByText("Pokemon")).toBeInTheDocument();
  });
});
