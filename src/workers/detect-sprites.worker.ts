import { detectSprites } from "../lib/detect-sprites";

export interface DetectSpritesMessage {
  imageData: ArrayBuffer;
  width: number;
  height: number;
  alphaThreshold: number;
  padding: number;
  fileName: string;
  bgColor?: [number, number, number] | null;
  bgTolerance?: number;
  minSize?: number;
}

function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

self.addEventListener("message", (event: MessageEvent<DetectSpritesMessage>) => {
  try {
    const {
      imageData, width, height, alphaThreshold, padding, fileName,
      bgColor, bgTolerance = 30, minSize = 4,
    } = event.data;

    const rgba = new Uint8Array(imageData);
    const totalPixels = width * height;
    const alphaData = new Uint8Array(totalPixels);

    for (let i = 0; i < totalPixels; i++) {
      const r = rgba[i * 4];
      const g = rgba[i * 4 + 1];
      const b = rgba[i * 4 + 2];
      const a = rgba[i * 4 + 3];

      // If background color is set, treat pixels close to it as transparent
      if (bgColor && a > alphaThreshold) {
        const dist = colorDistance(r, g, b, bgColor[0], bgColor[1], bgColor[2]);
        alphaData[i] = dist <= bgTolerance ? 0 : a;
      } else {
        alphaData[i] = a;
      }
    }

    let sprites = detectSprites(alphaData, width, height, alphaThreshold, padding);

    // Filter out sprites smaller than minSize
    if (minSize > 0) {
      sprites = sprites.filter(s => s.width >= minSize && s.height >= minSize);
    }

    // Re-assign IDs and names after filtering
    sprites.forEach((sprite, index) => {
      sprite.id = `rect-${index}`;
      sprite.name = `${fileName}-${index}`;
    });

    self.postMessage(sprites);
  } catch (err) {
    self.postMessage({ error: String(err) });
  }
});
