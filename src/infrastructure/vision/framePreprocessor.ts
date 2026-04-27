import type { ImageFrame } from "../../domain/entities";

export interface CardBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Normalised output size (standard card 63.5×88.9mm ratio)
const OUT_W = 300;
const OUT_H = 420;

export function preprocessFrame(
  source: ImageData,
  bounds: CardBounds,
): ImageFrame {
  const canvas = document.createElement("canvas");
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext("2d")!;

  // Create an intermediate canvas holding the source ImageData
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = source.width;
  srcCanvas.height = source.height;
  srcCanvas.getContext("2d")!.putImageData(source, 0, 0);

  ctx.drawImage(
    srcCanvas,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    OUT_W,
    OUT_H,
  );

  const outData = ctx.getImageData(0, 0, OUT_W, OUT_H);
  return {
    data: outData.data,
    width: OUT_W,
    height: OUT_H,
    capturedAt: new Date(),
  };
}
