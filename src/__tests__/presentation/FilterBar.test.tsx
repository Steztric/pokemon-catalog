import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterBar } from "../../presentation/components/FilterBar";
import type { CatalogFilter } from "../../domain/entities";

const SETS = [
  { id: "base1", name: "Base Set" },
  { id: "gym1", name: "Gym Heroes" },
];
const RARITIES = ["Common", "Uncommon", "Rare Holo"];
const EMPTY_FILTER: CatalogFilter = {};

describe("FilterBar", () => {
  it("renders name search input", () => {
    render(
      <FilterBar
        filter={EMPTY_FILTER}
        availableSets={SETS}
        availableRarities={RARITIES}
        onChange={() => {}}
      />
    );
    expect(screen.getByRole("searchbox", { name: /search by name/i })).toBeInTheDocument();
  });

  it("renders set, rarity, and type selects", () => {
    render(
      <FilterBar
        filter={EMPTY_FILTER}
        availableSets={SETS}
        availableRarities={RARITIES}
        onChange={() => {}}
      />
    );
    expect(screen.getByRole("combobox", { name: /filter by set/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /filter by rarity/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /filter by type/i })).toBeInTheDocument();
  });

  it("renders sort buttons", () => {
    render(
      <FilterBar
        filter={EMPTY_FILTER}
        availableSets={SETS}
        availableRarities={RARITIES}
        onChange={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rarity/i })).toBeInTheDocument();
  });

  it("does not show 'Clear filters' when no filter is active", () => {
    render(
      <FilterBar
        filter={EMPTY_FILTER}
        availableSets={SETS}
        availableRarities={RARITIES}
        onChange={() => {}}
      />
    );
    expect(screen.queryByRole("button", { name: /clear filters/i })).not.toBeInTheDocument();
  });

  it("shows 'Clear filters' when a filter is active", () => {
    render(
      <FilterBar
        filter={{ name: "Charizard" }}
        availableSets={SETS}
        availableRarities={RARITIES}
        onChange={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();
  });

  it("calls onChange when name input changes", () => {
    const onChange = vi.fn();
    render(
      <FilterBar
        filter={EMPTY_FILTER}
        availableSets={SETS}
        availableRarities={RARITIES}
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByRole("searchbox", { name: /search by name/i }), {
      target: { value: "Pikachu" },
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: "Pikachu" }));
  });
});
