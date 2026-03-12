import { describe, test, expect } from "vitest";
import { splitGrid } from "../split-grid";

describe("splitGrid", () => {
  test("should split image into grid cells", () => {
    const result = splitGrid({
      imageWidth: 128,
      imageHeight: 128,
      cellWidth: 64,
      cellHeight: 64,
      offsetX: 0,
      offsetY: 0,
      spacingX: 0, spacingY: 0,
      fileName: "test",
    });
    expect(result).toHaveLength(4);
    expect(result[0]).toMatchObject({ x: 0, y: 0, width: 64, height: 64, name: "test-0" });
    expect(result[1]).toMatchObject({ x: 64, y: 0, width: 64, height: 64, name: "test-1" });
    expect(result[2]).toMatchObject({ x: 0, y: 64, width: 64, height: 64, name: "test-2" });
    expect(result[3]).toMatchObject({ x: 64, y: 64, width: 64, height: 64, name: "test-3" });
  });

  test("should handle offset and spacing", () => {
    const result = splitGrid({
      imageWidth: 200,
      imageHeight: 100,
      cellWidth: 64,
      cellHeight: 64,
      offsetX: 10,
      offsetY: 10,
      spacingX: 4, spacingY: 4,
      fileName: "sprite",
    });
    // 10 + 64 = 74, 74 + 4 + 64 = 142, 142 + 4 + 64 = 210 > 200 -> 2 columns
    // 10 + 64 = 74, 74 + 4 + 64 = 142 > 100 -> 1 row
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ x: 10, y: 10, width: 64, height: 64 });
    expect(result[1]).toMatchObject({ x: 78, y: 10, width: 64, height: 64 });
  });

  test("should handle cell larger than image", () => {
    const result = splitGrid({
      imageWidth: 32,
      imageHeight: 32,
      cellWidth: 64,
      cellHeight: 64,
      offsetX: 0,
      offsetY: 0,
      spacingX: 0, spacingY: 0,
      fileName: "tiny",
    });
    expect(result).toHaveLength(0);
  });

  test("should generate unique ids", () => {
    const result = splitGrid({
      imageWidth: 128,
      imageHeight: 64,
      cellWidth: 64,
      cellHeight: 64,
      offsetX: 0,
      offsetY: 0,
      spacingX: 0, spacingY: 0,
      fileName: "test",
    });
    const ids = result.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
