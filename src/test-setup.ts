import "@testing-library/jest-dom";
import "fake-indexeddb/auto";

// jsdom does not ship ImageData without the native `canvas` package.
// Provide a minimal polyfill sufficient for unit tests.
if (typeof globalThis.ImageData === "undefined") {
  class ImageDataPolyfill {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    readonly colorSpace: PredefinedColorSpace = "srgb";

    constructor(widthOrData: number | Uint8ClampedArray, widthOrHeight: number, height?: number) {
      if (typeof widthOrData === "number") {
        this.width = widthOrData;
        this.height = widthOrHeight;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      } else {
        this.data = widthOrData;
        this.width = widthOrHeight;
        this.height = height!;
      }
    }
  }
  globalThis.ImageData = ImageDataPolyfill as unknown as typeof ImageData;
}
