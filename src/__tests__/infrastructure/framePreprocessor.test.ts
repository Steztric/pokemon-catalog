import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { preprocessFrame } from "../../infrastructure/vision/framePreprocessor";

// jsdom's canvas getContext always returns null. Provide a minimal stub.
function makeCtxStub(outW: number, outH: number) {
  return {
    putImageData: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => new ImageData(outW, outH)),
  };
}

beforeEach(() => {
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "canvas") {
      const canvas = { width: 0, height: 0 } as unknown as HTMLCanvasElement;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (canvas as any).getContext = () => makeCtxStub(300, 420);
      return canvas;
    }
    // Call the real createElement via the prototype to avoid infinite recursion
    return Object.getPrototypeOf(document).createElement.call(document, tag);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeImageData(w: number, h: number): ImageData {
  return new ImageData(w, h);
}

describe("preprocessFrame", () => {
  it("returns an ImageFrame with the normalised dimensions (300×420)", () => {
    const source = makeImageData(640, 480);
    const bounds = { x: 100, y: 50, width: 200, height: 280 };
    const frame = preprocessFrame(source, bounds);
    expect(frame.width).toBe(300);
    expect(frame.height).toBe(420);
  });

  it("sets capturedAt to a recent Date", () => {
    const before = Date.now();
    const source = makeImageData(640, 480);
    const frame = preprocessFrame(source, { x: 0, y: 0, width: 200, height: 280 });
    expect(frame.capturedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it("output data length matches 300×420×4 bytes", () => {
    const source = makeImageData(640, 480);
    const frame = preprocessFrame(source, { x: 0, y: 0, width: 200, height: 280 });
    expect(frame.data.length).toBe(300 * 420 * 4);
  });
});
