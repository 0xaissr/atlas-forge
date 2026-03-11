import { describe, test, expect } from "vitest";
import { detectSprites } from "../detect-sprites";

describe("detectSprites", () => {
  test("should detect single opaque rectangle", () => {
    const width = 10;
    const height = 10;
    const alphaData = new Uint8Array(width * height).fill(0);
    for (let y = 3; y < 7; y++) {
      for (let x = 3; x < 7; x++) {
        alphaData[y * width + x] = 255;
      }
    }
    const result = detectSprites(alphaData, width, height, 0, 0);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ x: 3, y: 3, width: 4, height: 4 });
  });

  test("should detect multiple separate sprites", () => {
    const width = 20;
    const height = 10;
    const alphaData = new Uint8Array(width * height).fill(0);
    // Left sprite (3x3 at position 1,1)
    for (let y = 1; y < 4; y++)
      for (let x = 1; x < 4; x++) alphaData[y * width + x] = 255;
    // Right sprite (4x3 at position 15,1)
    for (let y = 1; y < 4; y++)
      for (let x = 15; x < 19; x++) alphaData[y * width + x] = 255;
    const result = detectSprites(alphaData, width, height, 0, 0);
    expect(result).toHaveLength(2);
  });

  test("should respect alpha threshold", () => {
    const width = 10;
    const height = 10;
    const alphaData = new Uint8Array(width * height).fill(0);
    // Semi-transparent region (alpha = 50)
    for (let y = 2; y < 5; y++)
      for (let x = 2; x < 5; x++) alphaData[y * width + x] = 50;
    // With threshold 100, should not detect
    expect(detectSprites(alphaData, width, height, 100, 0)).toHaveLength(0);
    // With threshold 0, should detect
    expect(detectSprites(alphaData, width, height, 0, 0)).toHaveLength(1);
  });

  test("should apply padding to bounding boxes", () => {
    const width = 20;
    const height = 20;
    const alphaData = new Uint8Array(width * height).fill(0);
    for (let y = 5; y < 10; y++)
      for (let x = 5; x < 10; x++) alphaData[y * width + x] = 255;
    const result = detectSprites(alphaData, width, height, 0, 2);
    expect(result).toHaveLength(1);
    // Original: x=5, y=5, w=5, h=5. With padding 2: x=3, y=3, w=9, h=9
    expect(result[0]).toMatchObject({ x: 3, y: 3, width: 9, height: 9 });
  });

  test("should merge connected pixels into one sprite", () => {
    const width = 10;
    const height = 10;
    const alphaData = new Uint8Array(width * height).fill(0);
    // L-shaped region — should be ONE sprite, not two
    for (let x = 2; x < 5; x++) alphaData[2 * width + x] = 255; // horizontal bar
    for (let y = 2; y < 6; y++) alphaData[y * width + 2] = 255; // vertical bar
    const result = detectSprites(alphaData, width, height, 0, 0);
    expect(result).toHaveLength(1);
  });
});
