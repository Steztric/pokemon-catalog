import { useState, useEffect } from "react";
import { platform } from "../../infrastructure/platform";
import { buildPHashIndex, browserImageLoader } from "../../infrastructure/vision/pHashIndexBuilder";

export function usePHashIndexBuild(): { isBuilding: boolean } {
  const [isBuilding, setIsBuilding] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cards = await platform.storage.cardRepository.findAll();
      await buildPHashIndex(cards, platform.storage.pHashIndexRepository, browserImageLoader);
      if (!cancelled) setIsBuilding(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { isBuilding };
}
