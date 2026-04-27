import type { CardBounds } from "./framePreprocessor";

// Pokemon card aspect ratio (63.5 × 88.9 mm)
const CARD_RATIO = 63.5 / 88.9; // ≈ 0.714
const GUIDE_HEIGHT_FRACTION = 0.75; // guide rect occupies 75% of frame height
const CONTENT_THRESHOLD = 0.15;  // guide region must have at least 15% edge pixels
const DENSITY_RATIO = 1.4;       // guide must be 40% denser than the surrounding area
const STABILITY_FRAMES = 3;
const STABILITY_OVERLAP_THRESHOLD = 0.6;
const EDGE_THRESHOLD = 20;

export interface DetectionDebug {
  innerDensity: number | null;
  outerDensity: number | null;
  ratio: number | null;
  rejectReason: "none" | "low_density" | "no_contrast";
}

export interface DetectionResult {
  detected: boolean;
  bounds: CardBounds | null;
  stable: boolean;
  debug: DetectionDebug;
}

/** Returns a centred card-ratio guide rectangle for the given frame dimensions. */
export function guideRect(frameWidth: number, frameHeight: number): CardBounds {
  const height = Math.round(frameHeight * GUIDE_HEIGHT_FRACTION);
  const width = Math.round(height * CARD_RATIO);
  const x = Math.round((frameWidth - width) / 2);
  const y = Math.round((frameHeight - height) / 2);
  return { x, y, width, height };
}

function toGrayscaleHalf(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): { gray: Uint8Array; sw: number; sh: number } {
  const sw = Math.floor(w / 2);
  const sh = Math.floor(h / 2);
  const gray = new Uint8Array(sw * sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const src = (y * 2 * w + x * 2) * 4;
      gray[y * sw + x] = (data[src] * 77 + data[src + 1] * 150 + data[src + 2] * 29) >> 8;
    }
  }
  return { gray, sw, sh };
}

function buildEdgeMap(gray: Uint8Array, w: number, h: number): Uint8Array {
  const edges = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx =
        -gray[(y - 1) * w + (x - 1)] - 2 * gray[y * w + (x - 1)] - gray[(y + 1) * w + (x - 1)] +
         gray[(y - 1) * w + (x + 1)] + 2 * gray[y * w + (x + 1)] + gray[(y + 1) * w + (x + 1)];
      const gy =
        -gray[(y - 1) * w + (x - 1)] - 2 * gray[(y - 1) * w + x] - gray[(y - 1) * w + (x + 1)] +
         gray[(y + 1) * w + (x - 1)] + 2 * gray[(y + 1) * w + x] + gray[(y + 1) * w + (x + 1)];
      edges[y * w + x] = Math.sqrt(gx * gx + gy * gy) > EDGE_THRESHOLD ? 1 : 0;
    }
  }
  return edges;
}

function countRegion(
  edges: Uint8Array,
  w: number,
  h: number,
  rx: number, ry: number,
  rw: number, rh: number,
): { edgeCount: number; pixelCount: number } {
  const x1 = Math.max(0, rx), y1 = Math.max(0, ry);
  const x2 = Math.min(w - 1, rx + rw - 1);
  const y2 = Math.min(h - 1, ry + rh - 1);
  let edgeCount = 0, pixelCount = 0;
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      edgeCount += edges[y * w + x];
      pixelCount++;
    }
  }
  return { edgeCount, pixelCount };
}

function iou(a: CardBounds, b: CardBounds): number {
  const ix = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  const inter = ix * iy;
  const union = a.width * a.height + b.width * b.height - inter;
  return union > 0 ? inter / union : 0;
}

export class CardPresenceDetector {
  private history: (CardBounds | null)[] = [];

  detect(frame: ImageData): DetectionResult {
    const { gray, sw, sh } = toGrayscaleHalf(frame.data, frame.width, frame.height);
    const edges = buildEdgeMap(gray, sw, sh);

    const guide = guideRect(frame.width, frame.height);
    const rx = Math.floor(guide.x / 2);
    const ry = Math.floor(guide.y / 2);
    const rw = Math.floor(guide.width / 2);
    const rh = Math.floor(guide.height / 2);

    const inner = countRegion(edges, sw, sh, rx, ry, rw, rh);
    const full  = countRegion(edges, sw, sh, 0, 0, sw, sh);
    const outerEdges  = full.edgeCount  - inner.edgeCount;
    const outerPixels = full.pixelCount - inner.pixelCount;

    const innerDensity = inner.pixelCount > 0 ? inner.edgeCount / inner.pixelCount : 0;
    const outerDensity = outerPixels > 0 ? outerEdges / outerPixels : 0;
    const ratio = outerDensity > 0 ? innerDensity / outerDensity : innerDensity > 0 ? Infinity : 1;

    let rejectReason: DetectionDebug["rejectReason"] = "none";
    if (innerDensity < CONTENT_THRESHOLD) rejectReason = "low_density";
    else if (ratio < DENSITY_RATIO) rejectReason = "no_contrast";

    const detected = rejectReason === "none";
    const bounds = detected ? guide : null;
    const debug: DetectionDebug = { innerDensity, outerDensity, ratio, rejectReason };

    this.history.push(bounds);
    if (this.history.length > STABILITY_FRAMES) this.history.shift();

    if (!detected) return { detected: false, bounds: null, stable: false, debug };

    const stable =
      this.history.length === STABILITY_FRAMES &&
      this.history.every((h) => h !== null && iou(guide, h) >= STABILITY_OVERLAP_THRESHOLD);

    return { detected: true, bounds: guide, stable, debug };
  }

  reset(): void {
    this.history = [];
  }
}
