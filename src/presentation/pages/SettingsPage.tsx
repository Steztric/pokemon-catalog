import { useState } from "react";
import { settingsStore } from "../../infrastructure/settings/settingsStore";
import { useIndexStats } from "../hooks/useIndexStats";

export function SettingsPage() {
  const [openaiKey, setOpenaiKey] = useState(() => settingsStore.getOpenAIKey() ?? "");
  const [anthropicKey, setAnthropicKey] = useState(() => settingsStore.getAnthropicKey() ?? "");
  const [pokemonKey, setPokemonKey] = useState(() => settingsStore.getPokemonTcgKey() ?? "");
  const [saved, setSaved] = useState(false);

  const { indexedCount, totalCount, isRebuilding, rebuild } = useIndexStats();

  function handleSaveKeys() {
    settingsStore.setOpenAIKey(openaiKey);
    settingsStore.setAnthropicKey(anthropicKey);
    settingsStore.setPokemonTcgKey(pokemonKey);
    setSaved(true);
  }

  function markDirty() {
    setSaved(false);
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* API Keys */}
      <section aria-labelledby="api-keys-heading" className="mb-10">
        <h2 id="api-keys-heading" className="text-xl font-semibold text-gray-900 mb-1">
          API Keys
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Keys saved here override environment variables. Reload the page after saving to apply
          changes.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700 mb-1">
              OpenAI API Key
            </label>
            <input
              id="openai-key"
              type="password"
              value={openaiKey}
              onChange={(e) => { setOpenaiKey(e.target.value); markDirty(); }}
              placeholder="sk-…"
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Used for LLM-assisted card identification. Takes precedence over the Anthropic key.
            </p>
          </div>

          <div>
            <label
              htmlFor="anthropic-key"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Anthropic API Key
            </label>
            <input
              id="anthropic-key"
              type="password"
              value={anthropicKey}
              onChange={(e) => { setAnthropicKey(e.target.value); markDirty(); }}
              placeholder="sk-ant-…"
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Fallback when no OpenAI key is set.
            </p>
          </div>

          <div>
            <label
              htmlFor="pokemon-tcg-key"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Pokémon TCG API Key
            </label>
            <input
              id="pokemon-tcg-key"
              type="password"
              value={pokemonKey}
              onChange={(e) => { setPokemonKey(e.target.value); markDirty(); }}
              placeholder="Optional — raises rate limit to 20 000 req/day"
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={handleSaveKeys}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Save API Keys
          </button>
          {saved && (
            <span className="text-sm text-green-700 flex items-center gap-2">
              Saved.{" "}
              <button
                onClick={() => window.location.reload()}
                className="underline hover:no-underline"
              >
                Reload to apply
              </button>
            </span>
          )}
        </div>
      </section>

      {/* Card Index */}
      <section aria-labelledby="index-heading">
        <h2 id="index-heading" className="text-xl font-semibold text-gray-900 mb-1">
          Card Index
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          The local perceptual-hash index powers offline card identification. Rebuild it after
          downloading new card data.
        </p>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-700 mb-3">
            {indexedCount === null
              ? "Loading…"
              : totalCount === 0
              ? "No cards in the local database yet. Visit the Dashboard to download card data."
              : `${indexedCount} of ${totalCount} cards indexed`}
          </p>

          <button
            onClick={rebuild}
            disabled={isRebuilding || totalCount === 0}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isRebuilding ? "Rebuilding…" : "Rebuild Index"}
          </button>

          {isRebuilding && (
            <p className="mt-2 text-xs text-gray-500" aria-live="polite">
              Indexing {indexedCount ?? 0} of {totalCount ?? "?"} cards…
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
