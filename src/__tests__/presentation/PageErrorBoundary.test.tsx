import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageErrorBoundary } from "../../presentation/components/PageErrorBoundary";

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("kaboom");
  return <p>All good</p>;
}

describe("PageErrorBoundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when no error occurs", () => {
    render(
      <PageErrorBoundary>
        <Bomb shouldThrow={false} />
      </PageErrorBoundary>
    );
    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("renders the fallback alert when a child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <PageErrorBoundary>
        <Bomb shouldThrow={true} />
      </PageErrorBoundary>
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/kaboom/i)).toBeInTheDocument();
  });

  it("shows a Try again button in the fallback", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <PageErrorBoundary>
        <Bomb shouldThrow={true} />
      </PageErrorBoundary>
    );
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("clears the error state when Try again is clicked", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let shouldThrow = true;
    const { rerender } = render(
      <PageErrorBoundary>
        <Bomb shouldThrow={shouldThrow} />
      </PageErrorBoundary>
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Update children BEFORE resetting error state so the re-render doesn't throw again.
    shouldThrow = false;
    rerender(
      <PageErrorBoundary>
        <Bomb shouldThrow={shouldThrow} />
      </PageErrorBoundary>
    );
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("All good")).toBeInTheDocument();
  });
});
