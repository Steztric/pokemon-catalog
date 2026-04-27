import { describe, it, expect, beforeEach } from "vitest";
import { CardPresenceDetector, guideRect } from "../../infrastructure/vision/cardPresenceDetector";

function blankFrame(w: number, h: number): ImageData {
  return new ImageData(w, h);
}

// Fill the guide region with vertical stripes (8px wide = 4px in half-res).
// Non-symmetric transitions → strong Sobel gx inside guide.
// The outer region is left blank so innerDensity >> outerDensity.
function frameWithCardInGuide(w: number, h: number): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  const guide = guideRect(w, h);

  for (let y = guide.y; y < guide.y + guide.height; y++) {
    for (let x = guide.x; x < guide.x + guide.width; x++) {
      const v = Math.floor((x - guide.x) / 8) % 2 === 0 ? 200 : 20;
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return new ImageData(data, w, h);
}

// Uniform-noise frame — same pattern inside and outside the guide.
// innerDensity / outerDensity ≈ 1 → should NOT be detected.
function frameWithUniformEdges(w: number, h: number): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = Math.floor(x / 8) % 2 === 0 ? 200 : 20;
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return new ImageData(data, w, h);
}

describe("guideRect", () => {
  it("returns a rect centred in the frame with the card aspect ratio", () => {
    const r = guideRect(640, 480);
    expect(r.width / r.height).toBeCloseTo(63.5 / 88.9, 1);
    expect(r.x).toBe(Math.round((640 - r.width) / 2));
    expect(r.y).toBe(Math.round((480 - r.height) / 2));
  });
});

describe("CardPresenceDetector", () => {
  let detector: CardPresenceDetector;

  beforeEach(() => {
    detector = new CardPresenceDetector();
  });

  it("returns detected:false for a blank frame", () => {
    const result = detector.detect(blankFrame(640, 480));
    expect(result.detected).toBe(false);
    expect(result.bounds).toBeNull();
  });

  it("detects a card when the guide has high edge density vs. the background", () => {
    const frame = frameWithCardInGuide(640, 480);
    const result = detector.detect(frame);
    expect(result.detected).toBe(true);
    expect(result.bounds).not.toBeNull();
  });

  it("does NOT detect a card when edges are uniform across the whole frame", () => {
    const frame = frameWithUniformEdges(640, 480);
    const result = detector.detect(frame);
    expect(result.detected).toBe(false);
  });

  it("bounds equal the guide rect when detected", () => {
    const frame = frameWithCardInGuide(640, 480);
    const result = detector.detect(frame);
    const guide = guideRect(640, 480);
    expect(result.bounds).toEqual(guide);
  });

  it("reports stable:false on first detection", () => {
    const frame = frameWithCardInGuide(640, 480);
    const result = detector.detect(frame);
    expect(result.stable).toBe(false);
  });

  it("reports stable:true after STABILITY_FRAMES consistent detections", () => {
    const frame = frameWithCardInGuide(640, 480);
    let last: ReturnType<CardPresenceDetector["detect"]> = {
      detected: false, bounds: null, stable: false,
      debug: { innerDensity: null, outerDensity: null, ratio: null, rejectReason: "low_density" },
    };
    for (let i = 0; i < 5; i++) last = detector.detect(frame);
    expect(last.stable).toBe(true);
  });

  it("reset clears stability history", () => {
    const frame = frameWithCardInGuide(640, 480);
    for (let i = 0; i < 5; i++) detector.detect(frame);
    detector.reset();
    const result = detector.detect(frame);
    expect(result.stable).toBe(false);
  });

  it("debug includes innerDensity, outerDensity, and ratio", () => {
    const frame = frameWithCardInGuide(640, 480);
    const result = detector.detect(frame);
    expect(typeof result.debug.innerDensity).toBe("number");
    expect(typeof result.debug.outerDensity).toBe("number");
    expect(typeof result.debug.ratio).toBe("number");
  });
});
