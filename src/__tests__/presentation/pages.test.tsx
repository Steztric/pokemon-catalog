import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "../../presentation/pages/DashboardPage";
import { ScannerPage } from "../../presentation/pages/ScannerPage";

describe("DashboardPage", () => {
  it("renders without crashing", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
  });

  it("displays a link to the Scanner page", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /scanner/i })).toBeInTheDocument();
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
