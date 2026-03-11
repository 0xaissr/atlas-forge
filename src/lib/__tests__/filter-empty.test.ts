import { describe, test, expect } from "vitest";
import { filterEmptySprites } from "../filter-empty";
import { SpriteRect } from "@/types";

describe("filterEmptySprites", () => {
  // Helper to create RGBA data
  function createImageData(width: number, height: number, fillRegions: Array<{x: number, y: number, w: number, h: number}>) {
    const data = new Uint8ClampedArray(width * height * 4).fill(0); // all transparent
    for (const region of fillRegions) {
      for (let y = region.y; y < region.y + region.h; y++) {
        for (let x = region.x; x < region.x + region.w; x++) {
          const idx = (y * width + x) * 4;
          data[idx] = 255;     // R
          data[idx + 1] = 255; // G
          data[idx + 2] = 255; // B
          data[idx + 3] = 255; // A
        }
      }
    }
    return { data, width, height } as unknown as ImageData;
  }

  test("should remove fully transparent sprites", () => {
    // 128x64 image with content only in left half
    const imageData = createImageData(128, 64, [{ x: 0, y: 0, w: 64, h: 64 }]);
    const sprites: SpriteRect[] = [
      { id: "1", name: "s-0", x: 0, y: 0, width: 64, height: 64 },
      { id: "2", name: "s-1", x: 64, y: 0, width: 64, height: 64 }, // empty
    ];
    const result = filterEmptySprites(imageData, sprites);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  test("should keep sprites with any non-transparent pixel", () => {
    const imageData = createImageData(128, 64, [
      { x: 0, y: 0, w: 64, h: 64 },
      { x: 65, y: 1, w: 1, h: 1 }, // single pixel in second sprite
    ]);
    const sprites: SpriteRect[] = [
      { id: "1", name: "s-0", x: 0, y: 0, width: 64, height: 64 },
      { id: "2", name: "s-1", x: 64, y: 0, width: 64, height: 64 },
    ];
    const result = filterEmptySprites(imageData, sprites);
    expect(result).toHaveLength(2);
  });

  test("should return empty array if all sprites empty", () => {
    const imageData = createImageData(64, 64, []);
    const sprites: SpriteRect[] = [
      { id: "1", name: "s-0", x: 0, y: 0, width: 32, height: 32 },
      { id: "2", name: "s-1", x: 32, y: 0, width: 32, height: 32 },
    ];
    const result = filterEmptySprites(imageData, sprites);
    expect(result).toHaveLength(0);
  });
});
