import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardGrid } from "../../presentation/components/CardGrid";
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
    entry: { id: "e1", cardId: "base1-4", quantity: 1, firstAddedAt: new Date() },
  },
  {
    card: {
      id: "base1-58",
      name: "Pikachu",
      setId: "base1",
      setName: "Base Set",
      number: "58",
      rarity: "Common",
      type: "Pokemon",
      imageUrl: "https://example.com/pikachu.png",
    },
    entry: { id: "e2", cardId: "base1-58", quantity: 3, firstAddedAt: new Date() },
  },
];

describe("CardGrid", () => {
  it("renders all items", () => {
    render(<CardGrid items={ITEMS} />);
    expect(screen.getByText("Charizard")).toBeInTheDocument();
    expect(screen.getByText("Pikachu")).toBeInTheDocument();
  });

  it("shows quantity badge when quantity > 1", () => {
    render(<CardGrid items={ITEMS} />);
    expect(screen.getByText("×3")).toBeInTheDocument();
  });

  it("does not show quantity badge when quantity is 1", () => {
    render(<CardGrid items={ITEMS} />);
    expect(screen.queryByText("×1")).not.toBeInTheDocument();
  });
});
