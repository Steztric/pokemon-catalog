import type { PokemonCard, ImageFrame } from "../../domain/entities";
import type { IPHashIndexRepository } from "../../domain/interfaces";
import { computePHash, pHashToHex } from "./pHash";

export type ImageLoader = (url: string) => Promise<ImageFrame | null>;

export async function buildPHashIndex(
  cards: PokemonCard[],
  repo: IPHashIndexRepository,
  loadImage: ImageLoader,
  onProgress?: (processed: number, total: number) => void,
): Promise<{ indexed: number; skipped: number }> {
  let indexed = 0, skipped = 0;
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (await repo.hasCard(card.id)) {
      skipped++;
    } else {
      const frame = await loadImage(card.imageUrl);
      if (!frame) {
        skipped++;
      } else {
        const hash = computePHash(frame);
        await repo.upsert({ cardId: card.id, hashHex: pHashToHex(hash), indexedAt: new Date() });
        indexed++;
      }
    }
    onProgress?.(i + 1, cards.length);
  }
  return { indexed, skipped };
}

export function browserImageLoader(url: string): Promise<ImageFrame | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      resolve({ data: imageData.data, width: img.width, height: img.height, capturedAt: new Date() });
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
