import { useState, useEffect, useCallback } from "react";
import { platform } from "../../infrastructure/platform";
import { buildPHashIndex, browserImageLoader } from "../../infrastructure/vision/pHashIndexBuilder";

export interface IndexStats {
  indexedCount: number | null;
  totalCount: number | null;
  isRebuilding: boolean;
  rebuild: () => Promise<void>;
}

export function useIndexStats(): IndexStats {
  const [indexedCount, setIndexedCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isRebuilding, setIsRebuilding] = useState(false);

  const loadStats = useCallback(async () => {
    const [count, cards] = await Promise.all([
      platform.storage.pHashIndexRepository.count(),
      platform.storage.cardRepository.findAll(),
    ]);
    setIndexedCount(count);
    setTotalCount(cards.length);
  }, []);

  useEffect(() => {
    loadStats().catch(() => {});
  }, [loadStats]);

  const rebuild = useCallback(async () => {
    setIsRebuilding(true);
    try {
      const cards = await platform.storage.cardRepository.findAll();
      setTotalCount(cards.length);
      await buildPHashIndex(
        cards,
        platform.storage.pHashIndexRepository,
        browserImageLoader,
        (processed) => setIndexedCount(processed),
      );
    } finally {
      setIsRebuilding(false);
      loadStats().catch(() => {});
    }
  }, [loadStats]);

  return { indexedCount, totalCount, isRebuilding, rebuild };
}
