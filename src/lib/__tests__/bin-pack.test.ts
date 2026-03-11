import { describe, test, expect } from "vitest";
import { maxRectsPack } from "../bin-pack";

describe("maxRectsPack", () => {
  test("should pack rectangles into bin", () => {
    const rects = [
      { id: "1", width: 64, height: 64 },
      { id: "2", width: 32, height: 32 },
      { id: "3", width: 48, height: 48 },
    ];
    const result = maxRectsPack(rects, 128, 128, 0);
    expect(result.packed).toHaveLength(3);
    result.packed.forEach((r) => {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width).toBeLessThanOrEqual(128);
      expect(r.y + r.height).toBeLessThanOrEqual(128);
    });
  });

  test("should not overlap packed rectangles", () => {
    const rects = [
      { id: "1", width: 60, height: 60 },
      { id: "2", width: 60, height: 60 },
      { id: "3", width: 60, height: 60 },
    ];
    const result = maxRectsPack(rects, 256, 256, 0);
    expect(result.packed).toHaveLength(3);
    // Check no overlap
    for (let i = 0; i < result.packed.length; i++) {
      for (let j = i + 1; j < result.packed.length; j++) {
        const a = result.packed[i];
        const b = result.packed[j];
        const overlaps =
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y;
        expect(overlaps).toBe(false);
      }
    }
  });

  test("should report overflow when rects don't fit", () => {
    const rects = [{ id: "1", width: 256, height: 256 }];
    const result = maxRectsPack(rects, 128, 128, 0);
    expect(result.packed).toHaveLength(0);
    expect(result.overflow).toHaveLength(1);
  });

  test("should respect padding", () => {
    const rects = [
      { id: "1", width: 60, height: 60 },
      { id: "2", width: 60, height: 60 },
    ];
    const result = maxRectsPack(rects, 128, 128, 4);
    expect(result.packed).toHaveLength(2);
    // With padding=4, effective sizes are 64x64, so two 64x64 fit in 128x128
    // But they shouldn't overlap even with padding
    const a = result.packed[0];
    const b = result.packed[1];
    // Check minimum distance
    const xSep = Math.abs((a.x + a.width) - b.x);
    const ySep = Math.abs((a.y + a.height) - b.y);
    expect(xSep >= 4 || ySep >= 4).toBe(true);
  });

  test("should handle empty input", () => {
    const result = maxRectsPack([], 128, 128, 0);
    expect(result.packed).toHaveLength(0);
    expect(result.overflow).toHaveLength(0);
  });
});
