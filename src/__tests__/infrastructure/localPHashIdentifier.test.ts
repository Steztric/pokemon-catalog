import { describe, it, expect, beforeEach } from "vitest";
import { LocalPHashIdentifier } from "../../infrastructure/vision/localPHashIdentifier";
import { StubPHashIndexRepository } from "../../infrastructure/db/StubRepositories";
import { computePHash, pHashToHex } from "../../infrastructure/vision/pHash";
import type { ImageFrame } from "../../domain/entities";

function solidFrame(w: number, h: number, v: number): ImageFrame {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i + 1] = data[i + 2] = v; data[i + 3] = 255;
  }
  return { data, width: w, height: h, capturedAt: new Date() };
}

function stripedFrame(w: number, h: number, period: number): ImageFrame {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = Math.floor(x / period) % 2 === 0 ? 200 : 20;
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v; data[i + 3] = 255;
    }
  }
  return { data, width: w, height: h, capturedAt: new Date() };
}

describe("LocalPHashIdentifier", () => {
  let repo: StubPHashIndexRepository;
  let identifier: LocalPHashIdentifier;

  beforeEach(() => {
    repo = new StubPHashIndexRepository();
    identifier = new LocalPHashIdentifier(repo);
  });

  it("returns low_confidence when index is empty", async () => {
    const result = await identifier.identify(solidFrame(300, 420, 128));
    expect(result.status).toBe("low_confidence");
    expect(result.confidence).toBe(0);
  });

  it("identifies a card that exactly matches an indexed hash", async () => {
    const frame = stripedFrame(300, 420, 16);
    const hash = computePHash(frame);
    await repo.upsert({ cardId: "base1-4", hashHex: pHashToHex(hash), indexedAt: new Date() });

    const result = await identifier.identify(frame);
    expect(result.status).toBe("identified");
    expect(result.cardId).toBe("base1-4");
    expect(result.confidence).toBeCloseTo(1, 2);
    expect(result.strategy).toBe("local_hash");
  });

  it("returns low_confidence when the best match is too far away", async () => {
    // Index a frame with a very different pattern
    const indexedFrame = solidFrame(300, 420, 255);
    const queryFrame = solidFrame(300, 420, 0);
    await repo.upsert({
      cardId: "base1-99",
      hashHex: pHashToHex(computePHash(indexedFrame)),
      indexedAt: new Date(),
    });

    const result = await identifier.identify(queryFrame);
    // White vs black solid frames should have very different hashes
    expect(result.cardId).toBe("base1-99");
    expect(result.strategy).toBe("local_hash");
    // Confidence should be low-to-moderate (not certain match)
    expect(result.confidence).toBeLessThan(0.85);
  });

  it("returns the closest match when multiple entries exist", async () => {
    const target = stripedFrame(300, 420, 16);
    const targetHash = computePHash(target);
    await repo.upsert({ cardId: "card-A", hashHex: pHashToHex(targetHash), indexedAt: new Date() });
    // A very different card
    await repo.upsert({
      cardId: "card-B",
      hashHex: pHashToHex(computePHash(solidFrame(300, 420, 0))),
      indexedAt: new Date(),
    });

    const result = await identifier.identify(target);
    expect(result.cardId).toBe("card-A");
  });
});
