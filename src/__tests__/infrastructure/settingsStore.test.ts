import { describe, it, expect, beforeEach } from "vitest";
import { settingsStore } from "../../infrastructure/settings/settingsStore";

describe("settingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns undefined for unset keys", () => {
    expect(settingsStore.getOpenAIKey()).toBeUndefined();
    expect(settingsStore.getAnthropicKey()).toBeUndefined();
    expect(settingsStore.getPokemonTcgKey()).toBeUndefined();
  });

  it("round-trips an OpenAI key", () => {
    settingsStore.setOpenAIKey("sk-test-openai");
    expect(settingsStore.getOpenAIKey()).toBe("sk-test-openai");
  });

  it("round-trips an Anthropic key", () => {
    settingsStore.setAnthropicKey("sk-ant-test");
    expect(settingsStore.getAnthropicKey()).toBe("sk-ant-test");
  });

  it("round-trips a Pokemon TCG key", () => {
    settingsStore.setPokemonTcgKey("ptcg-xyz");
    expect(settingsStore.getPokemonTcgKey()).toBe("ptcg-xyz");
  });

  it("clears a key when set to empty string", () => {
    settingsStore.setOpenAIKey("sk-test");
    settingsStore.setOpenAIKey("");
    expect(settingsStore.getOpenAIKey()).toBeUndefined();
  });

  it("stores each key under a distinct namespace", () => {
    settingsStore.setOpenAIKey("openai-val");
    settingsStore.setAnthropicKey("anthropic-val");
    settingsStore.setPokemonTcgKey("ptcg-val");
    expect(settingsStore.getOpenAIKey()).toBe("openai-val");
    expect(settingsStore.getAnthropicKey()).toBe("anthropic-val");
    expect(settingsStore.getPokemonTcgKey()).toBe("ptcg-val");
  });

  it("overwrites an existing key", () => {
    settingsStore.setAnthropicKey("old-key");
    settingsStore.setAnthropicKey("new-key");
    expect(settingsStore.getAnthropicKey()).toBe("new-key");
  });
});
