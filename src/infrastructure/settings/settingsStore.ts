const PREFIX = "pokemon-catalog";

function read(key: string): string | undefined {
  try {
    return localStorage.getItem(`${PREFIX}.${key}`) || undefined;
  } catch {
    return undefined;
  }
}

function write(key: string, value: string): void {
  try {
    if (value) {
      localStorage.setItem(`${PREFIX}.${key}`, value);
    } else {
      localStorage.removeItem(`${PREFIX}.${key}`);
    }
  } catch {
    // storage unavailable — silently ignore
  }
}

export const settingsStore = {
  getOpenAIKey: (): string | undefined => read("openaiApiKey"),
  setOpenAIKey: (v: string): void => write("openaiApiKey", v),

  getAnthropicKey: (): string | undefined => read("anthropicApiKey"),
  setAnthropicKey: (v: string): void => write("anthropicApiKey", v),

  getPokemonTcgKey: (): string | undefined => read("pokemonTcgApiKey"),
  setPokemonTcgKey: (v: string): void => write("pokemonTcgApiKey", v),
};
