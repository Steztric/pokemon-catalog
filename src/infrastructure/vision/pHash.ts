import type { ImageFrame } from "../../domain/entities";

const DCT_SIZE = 32;
const HASH_BITS = 8; // 8×8 = 64-bit hash

function resize32(frame: ImageFrame): Float64Array {
  const { data, width, height } = frame;
  const out = new Float64Array(DCT_SIZE * DCT_SIZE);
  for (let y = 0; y < DCT_SIZE; y++) {
    for (let x = 0; x < DCT_SIZE; x++) {
      const sx = Math.round((x * (width - 1)) / (DCT_SIZE - 1));
      const sy = Math.round((y * (height - 1)) / (DCT_SIZE - 1));
      const i = (sy * width + sx) * 4;
      out[y * DCT_SIZE + x] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) / 256;
    }
  }
  return out;
}

function dct1d(src: Float64Array, srcOff: number, dst: Float64Array, dstOff: number, stride: number): void {
  const N = DCT_SIZE;
  for (let k = 0; k < N; k++) {
    let sum = 0;
    for (let n = 0; n < N; n++) {
      sum += src[srcOff + n * stride] * Math.cos((Math.PI * k * (2 * n + 1)) / (2 * N));
    }
    dst[dstOff + k * stride] = sum;
  }
}

function dct2d(pixels: Float64Array): Float64Array {
  const N = DCT_SIZE;
  const tmp = new Float64Array(N * N);
  const result = new Float64Array(N * N);

  // Rows
  for (let y = 0; y < N; y++) dct1d(pixels, y * N, tmp, y * N, 1);
  // Columns
  for (let x = 0; x < N; x++) dct1d(tmp, x, result, x, N);

  return result;
}

export function computePHash(frame: ImageFrame): bigint {
  const pixels = resize32(frame);
  const dct = dct2d(pixels);

  // Top-left HASH_BITS × HASH_BITS block
  const block = new Float64Array(HASH_BITS * HASH_BITS);
  for (let y = 0; y < HASH_BITS; y++) {
    for (let x = 0; x < HASH_BITS; x++) {
      block[y * HASH_BITS + x] = dct[y * DCT_SIZE + x];
    }
  }

  const sorted = Float64Array.from(block).sort();
  const median = (sorted[31] + sorted[32]) / 2;

  let hash = 0n;
  for (let i = 0; i < HASH_BITS * HASH_BITS; i++) {
    hash = (hash << 1n) | (block[i] > median ? 1n : 0n);
  }
  return hash;
}

export function hammingDistance(a: bigint, b: bigint): number {
  let xor = a ^ b;
  let count = 0;
  while (xor > 0n) {
    xor &= xor - 1n;
    count++;
  }
  return count;
}

export function pHashToHex(hash: bigint): string {
  return hash.toString(16).padStart(16, "0");
}

export function hexToPHash(hex: string): bigint {
  return BigInt("0x" + hex);
}
