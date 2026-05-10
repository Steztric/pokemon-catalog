import { useState, useEffect } from "react";
import type { IImageCacheAdapter } from "../../domain/interfaces";
import { platform } from "../../infrastructure/platform";

export function useCardImage(
  cardId: string,
  remoteUrl: string,
  imageCache: IImageCacheAdapter = platform.imageCache,
): string {
  const [url, setUrl] = useState(remoteUrl);

  useEffect(() => {
    let active = true;
    imageCache.get(cardId).then((cached) => {
      if (active && cached) setUrl(cached);
    });
    return () => {
      active = false;
    };
  }, [cardId, imageCache]);

  return url;
}
