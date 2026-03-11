import type { SpriteRect } from "../types";
import { maxRectsPack } from "./bin-pack";

export interface RepackOptions {
  sprites: SpriteRect[];
  sourceImage: ImageBitmap;
  maxSize: number;
  padding: number;
  trim: boolean;
}

export interface RepackResult {
  imageBlob: Blob;
  sprites: SpriteRect[];
  width: number;
  height: number;
  overflow: string[];
}

interface TrimmedSprite {
  sprite: SpriteRect;
  trimX: number;
  trimY: number;
  trimW: number;
  trimH: number;
}

/**
 * Repack sprites into a new optimized atlas image.
 * Uses OffscreenCanvas — compatible with Web Workers.
 */
export async function repackAtlas(
  options: RepackOptions
): Promise<RepackResult> {
  const { sprites, sourceImage, maxSize, padding, trim } = options;

  if (sprites.length === 0) {
    const canvas = new OffscreenCanvas(1, 1);
    const blob = await canvas.convertToBlob({ type: "image/png" });
    return { imageBlob: blob, sprites: [], width: 1, height: 1, overflow: [] };
  }

  // Step 1: Compute trimmed bounds if trim enabled
  const trimmedSprites = trim
    ? computeTrimmedBounds(sprites, sourceImage)
    : sprites.map((s) => ({
        sprite: s,
        trimX: s.x,
        trimY: s.y,
        trimW: s.width,
        trimH: s.height,
      }));

  // Step 2: Bin pack
  const packInput = trimmedSprites.map((ts) => ({
    id: ts.sprite.id,
    width: ts.trimW,
    height: ts.trimH,
  }));

  const packResult = maxRectsPack(packInput, maxSize, maxSize, padding);

  // Step 3: Compute packed canvas dimensions (tight fit)
  let canvasW = 0;
  let canvasH = 0;
  for (const p of packResult.packed) {
    canvasW = Math.max(canvasW, p.x + p.width);
    canvasH = Math.max(canvasH, p.y + p.height);
  }
  // Ensure minimum size
  canvasW = Math.max(canvasW, 1);
  canvasH = Math.max(canvasH, 1);

  // Step 4: Draw sprites to new canvas
  const canvas = new OffscreenCanvas(canvasW, canvasH);
  const ctx = canvas.getContext("2d")!;

  // Build lookup for trimmed data
  const trimMap = new Map<string, TrimmedSprite>();
  for (const ts of trimmedSprites) {
    trimMap.set(ts.sprite.id, ts);
  }

  const newSprites: SpriteRect[] = [];

  for (const packed of packResult.packed) {
    const ts = trimMap.get(packed.id)!;

    // Draw from source image (trimmed region) to new position
    ctx.drawImage(
      sourceImage,
      ts.trimX,
      ts.trimY,
      ts.trimW,
      ts.trimH,
      packed.x,
      packed.y,
      packed.width,
      packed.height
    );

    newSprites.push({
      id: ts.sprite.id,
      name: ts.sprite.name,
      x: packed.x,
      y: packed.y,
      width: packed.width,
      height: packed.height,
    });
  }

  // Step 5: Export as PNG
  const imageBlob = await canvas.convertToBlob({ type: "image/png" });

  return {
    imageBlob,
    sprites: newSprites,
    width: canvasW,
    height: canvasH,
    overflow: packResult.overflow.map((o) => o.id),
  };
}

/**
 * Compute tight bounding boxes by skipping fully transparent pixels.
 */
function computeTrimmedBounds(
  sprites: SpriteRect[],
  sourceImage: ImageBitmap
): TrimmedSprite[] {
  // Draw source image to a temporary canvas to read pixel data
  const tempCanvas = new OffscreenCanvas(sourceImage.width, sourceImage.height);
  const ctx = tempCanvas.getContext("2d")!;
  ctx.drawImage(sourceImage, 0, 0);
  const fullImageData = ctx.getImageData(
    0,
    0,
    sourceImage.width,
    sourceImage.height
  );
  const pixels = fullImageData.data;
  const imgW = sourceImage.width;

  return sprites.map((sprite) => {
    let minX = sprite.x + sprite.width;
    let minY = sprite.y + sprite.height;
    let maxX = sprite.x;
    let maxY = sprite.y;

    for (let y = sprite.y; y < sprite.y + sprite.height; y++) {
      for (let x = sprite.x; x < sprite.x + sprite.width; x++) {
        const alpha = pixels[(y * imgW + x) * 4 + 3];
        if (alpha > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // If entirely transparent, keep original bounds (1x1 minimum)
    if (maxX < minX || maxY < minY) {
      return {
        sprite,
        trimX: sprite.x,
        trimY: sprite.y,
        trimW: sprite.width,
        trimH: sprite.height,
      };
    }

    return {
      sprite,
      trimX: minX,
      trimY: minY,
      trimW: maxX - minX + 1,
      trimH: maxY - minY + 1,
    };
  });
}
