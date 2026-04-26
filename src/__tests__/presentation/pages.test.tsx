import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardPage } from "../../presentation/pages/DashboardPage";
import { ScannerPage } from "../../presentation/pages/ScannerPage";
import type { CardDetail } from "../../application/usecases/GetCardDetail";

const { mockUseCatalog } = vi.hoisted(() => ({ mockUseCatalog: vi.fn() }));
vi.mock("../../presentation/hooks/useCatalog", () => ({
  useCatalog: mockUseCatalog,
}));

function makeDetail(id: string, name: string): CardDetail {
  return {
    card: {
      id,
      name,
      setId: "base1",
      setName: "Base Set",
      number: "1",
      rarity: "Common",
      type: "Pokemon",
      imageUrl: `https://example.com/${id}.png`,
    },
    entry: { id: `e-${id}`, cardId: id, quantity: 1, firstAddedAt: new Date() },
  };
}

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    mockUseCatalog.mockReset();
  });

  it("renders the heading", () => {
    mockUseCatalog.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderDashboard();
    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
  });

  it("displays a link to the Scanner page", () => {
    mockUseCatalog.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderDashboard();
    expect(screen.getByRole("link", { name: /scanner/i })).toBeInTheDocument();
  });

  it("shows skeleton tiles while loading", () => {
    mockUseCatalog.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { container } = renderDashboard();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("shows card names when data is loaded", () => {
    mockUseCatalog.mockReturnValue({
      data: [makeDetail("base1-4", "Charizard"), makeDetail("base1-58", "Pikachu")],
      isLoading: false,
      isError: false,
    });
    renderDashboard();
    expect(screen.getByText("Charizard")).toBeInTheDocument();
    expect(screen.getByText("Pikachu")).toBeInTheDocument();
  });

  it("shows empty state message when collection has no cards", () => {
    mockUseCatalog.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderDashboard();
    expect(screen.getByText(/start scanning/i)).toBeInTheDocument();
  });

  it("shows error message on failure", () => {
    mockUseCatalog.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderDashboard();
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });
});

describe("ScannerPage", () => {
  it("renders without crashing", () => {
    render(
      <MemoryRouter>
        <ScannerPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /scanner/i })).toBeInTheDocument();
  });

  it("displays a link to the Dashboard page", () => {
    render(
      <MemoryRouter>
        <ScannerPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
  });
});
