import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConfirmationPanel } from "../../presentation/components/ConfirmationPanel";
import type { ConfirmationData } from "../../presentation/components/ConfirmationPanel";
import type { PokemonCard, CatalogEntry } from "../../domain/entities";

const card: PokemonCard = {
  id: "base1-4",
  name: "Charizard",
  setId: "base1",
  setName: "Base Set",
  number: "4",
  rarity: "Rare Holo",
  type: "Pokemon",
  imageUrl: "https://images.pokemontcg.io/base1/4_hires.png",
};

const entry: CatalogEntry = {
  id: "e1",
  cardId: "base1-4",
  quantity: 3,
  firstAddedAt: new Date(),
};

function makeData(overrides: Partial<ConfirmationData> = {}): ConfirmationData {
  return {
    result: { status: "identified", cardId: "base1-4", confidence: 0.95, strategy: "local_hash" },
    card,
    existingEntry: null,
    ...overrides,
  };
}

const noop = vi.fn().mockResolvedValue(undefined);
const noopSearch = vi.fn().mockResolvedValue([]);

describe("ConfirmationPanel — review mode", () => {
  it("renders the card name and set", () => {
    render(
      <ConfirmationPanel data={makeData()} onConfirm={noop} onReject={noop} searchCards={noopSearch} />
    );
    expect(screen.getByText("Charizard")).toBeInTheDocument();
    expect(screen.getByText(/Base Set/)).toBeInTheDocument();
  });

  it("shows the Confirm button enabled for an identified card", () => {
    render(
      <ConfirmationPanel data={makeData()} onConfirm={noop} onReject={noop} searchCards={noopSearch} />
    );
    const btn = screen.getByRole("button", { name: /confirm/i });
    expect(btn).not.toBeDisabled();
  });

  it("shows the low-confidence badge for low_confidence results", () => {
    render(
      <ConfirmationPanel
        data={makeData({ result: { status: "low_confidence", cardId: "base1-4", confidence: 0.3, strategy: "local_hash" } })}
        onConfirm={noop}
        onReject={noop}
        searchCards={noopSearch}
      />
    );
    expect(screen.getByText(/low confidence/i)).toBeInTheDocument();
  });

  it("shows the duplicate badge with quantity when card is already in collection", () => {
    render(
      <ConfirmationPanel
        data={makeData({ existingEntry: entry })}
        onConfirm={noop}
        onReject={noop}
        searchCards={noopSearch}
      />
    );
    expect(screen.getByText(/already in collection/i)).toBeInTheDocument();
    expect(screen.getByText(/×3/)).toBeInTheDocument();
  });

  it("shows 'No image' placeholder when card is null", () => {
    render(
      <ConfirmationPanel
        data={makeData({ card: null, result: { status: "low_confidence", confidence: 0, strategy: "local_hash" } })}
        onConfirm={noop}
        onReject={noop}
        searchCards={noopSearch}
      />
    );
    expect(screen.getByText(/no image/i)).toBeInTheDocument();
  });

  it("Confirm button is disabled when there is no cardId", () => {
    render(
      <ConfirmationPanel
        data={makeData({ card: null, result: { status: "low_confidence", confidence: 0, strategy: "local_hash" } })}
        onConfirm={noop}
        onReject={noop}
        searchCards={noopSearch}
      />
    );
    const btn = screen.getByRole("button", { name: /confirm/i });
    expect(btn).toBeDisabled();
  });

  it("calls onConfirm with the cardId when Confirm is clicked", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ConfirmationPanel data={makeData()} onConfirm={onConfirm} onReject={noop} searchCards={noopSearch} />
    );
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith("base1-4"));
  });

  it("calls onReject when Reject is clicked", () => {
    const onReject = vi.fn();
    render(
      <ConfirmationPanel data={makeData()} onConfirm={noop} onReject={onReject} searchCards={noopSearch} />
    );
    fireEvent.click(screen.getByRole("button", { name: /reject/i }));
    expect(onReject).toHaveBeenCalled();
  });
});

describe("ConfirmationPanel — search mode", () => {
  it("transitions to search mode when 'Search manually' is clicked", () => {
    render(
      <ConfirmationPanel data={makeData()} onConfirm={noop} onReject={noop} searchCards={noopSearch} />
    );
    fireEvent.click(screen.getByRole("button", { name: /search manually/i }));
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("shows search results after typing", async () => {
    const searchCards = vi.fn().mockResolvedValue([card]);
    render(
      <ConfirmationPanel data={makeData()} onConfirm={noop} onReject={noop} searchCards={searchCards} />
    );
    fireEvent.click(screen.getByRole("button", { name: /search manually/i }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Char" } });
    await waitFor(() => {
      expect(screen.getByText("Charizard")).toBeInTheDocument();
    });
  });

  it("calls onReject when 'Cancel — skip' is clicked from search mode", () => {
    const onReject = vi.fn();
    render(
      <ConfirmationPanel data={makeData()} onConfirm={noop} onReject={onReject} searchCards={noopSearch} />
    );
    fireEvent.click(screen.getByRole("button", { name: /search manually/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onReject).toHaveBeenCalled();
  });
});
