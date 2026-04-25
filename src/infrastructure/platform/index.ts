import type { IPlatform } from "../../domain/interfaces";
import { stubPlatform } from "./StubPlatform";
import { PokemonTCGApiClient } from "../api/PokemonTCGApiClient";
import { CachingCardDataProvider } from "../api/CachingCardDataProvider";

function resolvePlatform(): IPlatform {
  const { storage } = stubPlatform;
  return {
    ...stubPlatform,
    // Phase 4 will replace storage with real SQLite/IndexedDB repositories.
    // CachingCardDataProvider already writes through to the repositories,
    // so real persistence will start working automatically once Phase 4 lands.
    cardDataProvider: new CachingCardDataProvider(
      new PokemonTCGApiClient(),
      storage.cardRepository,
      storage.cardSetRepository,
    ),
  };
}

export const platform: IPlatform = resolvePlatform();
