import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IndexRefreshBanner } from "../../presentation/components/IndexRefreshBanner";

describe("IndexRefreshBanner", () => {
  it("renders the banner when isBuilding is true", () => {
    render(<IndexRefreshBanner isBuilding={true} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/rebuilding card index/i)).toBeInTheDocument();
  });

  it("renders nothing when isBuilding is false", () => {
    const { container } = render(<IndexRefreshBanner isBuilding={false} />);
    expect(container.firstChild).toBeNull();
  });
});
