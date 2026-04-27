import { describe, it, expect } from "vitest";
import { computePHash, hammingDistance, pHashToHex, hexToPHash } from "../../infrastructure/vision/pHash";
import type { ImageFrame } from "../../domain/entities";

function solidFrame(w: number, h: number, r: number, g: number, b: number): ImageFrame {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
  }
  return { data, width: w, height: h, capturedAt: new Date() };
}

function stripedFrame(w: number, h: number): ImageFrame {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = Math.floor(x / 16) % 2 === 0 ? 200 : 50;
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v; data[i + 3] = 255;
    }
  }
  return { data, width: w, height: h, capturedAt: new Date() };
}

describe("computePHash", () => {
  it("returns a BigInt", () => {
    const hash = computePHash(solidFrame(64, 64, 128, 128, 128));
    expect(typeof hash).toBe("bigint");
  });

  it("identical frames produce the same hash", () => {
    const frame = stripedFrame(300, 420);
    expect(computePHash(frame)).toBe(computePHash(frame));
  });

  it("different frames produce different hashes", () => {
    const a = solidFrame(300, 420, 200, 0, 0);
    const b = solidFrame(300, 420, 0, 0, 200);
    expect(computePHash(a)).not.toBe(computePHash(b));
  });
});

describe("hammingDistance", () => {
  it("returns 0 for identical hashes", () => {
    const h = 0xdeadbeefcafef00dn;
    expect(hammingDistance(h, h)).toBe(0);
  });

  it("counts differing bits correctly", () => {
    // 0b0001 ^ 0b0110 = 0b0111 → 3 bits differ
    expect(hammingDistance(0b0001n, 0b0110n)).toBe(3);
    expect(hammingDistance(0b1111n, 0b0000n)).toBe(4);
    // 0b1100 ^ 0b0110 = 0b1010 → 2 bits differ
    expect(hammingDistance(0b1100n, 0b0110n)).toBe(2);
  });
});

describe("pHashToHex / hexToPHash", () => {
  it("round-trips a hash through hex representation", () => {
    const original = 0xdeadbeefcafe0123n;
    expect(hexToPHash(pHashToHex(original))).toBe(original);
  });

  it("pads to 16 hex characters", () => {
    expect(pHashToHex(0n)).toHaveLength(16);
    expect(pHashToHex(1n)).toHaveLength(16);
  });
});
