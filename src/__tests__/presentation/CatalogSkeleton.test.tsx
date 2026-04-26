import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CatalogSkeleton } from "../../presentation/components/CatalogSkeleton";

describe("CatalogSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<CatalogSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders the default number of skeleton tiles", () => {
    const { container } = render(<CatalogSkeleton />);
    const tiles = container.querySelectorAll(".animate-pulse");
    expect(tiles.length).toBe(10);
  });

  it("renders a custom count of skeleton tiles", () => {
    const { container } = render(<CatalogSkeleton count={3} />);
    const tiles = container.querySelectorAll(".animate-pulse");
    expect(tiles.length).toBe(3);
  });
});
