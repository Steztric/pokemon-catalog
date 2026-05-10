import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SettingsPage } from "../../presentation/pages/SettingsPage";

vi.mock("../../infrastructure/settings/settingsStore", () => ({
  settingsStore: {
    getOpenAIKey: () => undefined,
    setOpenAIKey: vi.fn(),
    getAnthropicKey: () => undefined,
    setAnthropicKey: vi.fn(),
    getPokemonTcgKey: () => undefined,
    setPokemonTcgKey: vi.fn(),
  },
}));

vi.mock("../../presentation/hooks/useIndexStats", () => ({
  useIndexStats: () => ({
    indexedCount: 150,
    totalCount: 200,
    isRebuilding: false,
    rebuild: vi.fn(),
  }),
}));

function renderSettings() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>
  );
}

describe("SettingsPage", () => {
  it("renders the Settings heading", () => {
    renderSettings();
    expect(screen.getByRole("heading", { name: /settings/i, level: 1 })).toBeInTheDocument();
  });

  it("shows all three API key inputs", () => {
    renderSettings();
    expect(screen.getByLabelText(/openai api key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/anthropic api key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pokémon tcg api key/i)).toBeInTheDocument();
  });

  it("shows the Save API Keys button", () => {
    renderSettings();
    expect(screen.getByRole("button", { name: /save api keys/i })).toBeInTheDocument();
  });

  it("shows the Card Index section with indexed count", () => {
    renderSettings();
    expect(screen.getByRole("heading", { name: /card index/i })).toBeInTheDocument();
    expect(screen.getByText(/150 of 200 cards indexed/i)).toBeInTheDocument();
  });

  it("shows the Rebuild Index button", () => {
    renderSettings();
    expect(screen.getByRole("button", { name: /rebuild index/i })).toBeInTheDocument();
  });

  it("API key inputs are type=password", () => {
    renderSettings();
    const inputs = screen.getAllByDisplayValue("") as HTMLInputElement[];
    const passwordInputs = inputs.filter((i) => i.type === "password");
    expect(passwordInputs.length).toBeGreaterThanOrEqual(3);
  });
});
