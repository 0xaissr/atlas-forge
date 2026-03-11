import { describe, test, expect } from "vitest";
import { exportUnityMeta } from "../export-unity";

describe("exportUnityMeta", () => {
  const sprites = [
    { id: "1", name: "coin-0", x: 0, y: 0, width: 64, height: 64 },
    { id: "2", name: "coin-1", x: 64, y: 0, width: 32, height: 32 },
  ];

  test("should generate valid YAML-like unity meta", () => {
    const meta = exportUnityMeta(sprites, "coins.png", 128, 128);
    expect(meta).toContain("fileFormatVersion: 2");
    expect(meta).toContain("TextureImporter:");
    expect(meta).toContain("spriteMode: 2");
  });

  test("should include all sprites", () => {
    const meta = exportUnityMeta(sprites, "coins.png", 128, 128);
    expect(meta).toContain("name: coin-0");
    expect(meta).toContain("name: coin-1");
  });

  test("should flip Y coordinates (Unity Y-up)", () => {
    const meta = exportUnityMeta(sprites, "coins.png", 128, 128);
    // coin-0: y=0, h=64 → unity y = 128 - 0 - 64 = 64
    expect(meta).toMatch(/name: coin-0[\s\S]*?y: 64/);
    // coin-1: y=0, h=32 → unity y = 128 - 0 - 32 = 96
    expect(meta).toMatch(/name: coin-1[\s\S]*?y: 96/);
  });

  test("should include correct rect dimensions", () => {
    const meta = exportUnityMeta(sprites, "coins.png", 128, 128);
    // coin-0: width=64, height=64
    expect(meta).toMatch(/name: coin-0[\s\S]*?width: 64[\s\S]*?height: 64/);
    // coin-1: width=32, height=32
    expect(meta).toMatch(/name: coin-1[\s\S]*?width: 32[\s\S]*?height: 32/);
  });

  test("should include pivot and border defaults", () => {
    const meta = exportUnityMeta(sprites, "coins.png", 128, 128);
    expect(meta).toContain("pivot: {x: 0.5, y: 0.5}");
    expect(meta).toContain("border: {x: 0, y: 0, z: 0, w: 0}");
  });

  test("should generate a guid", () => {
    const meta = exportUnityMeta(sprites, "coins.png", 128, 128);
    expect(meta).toMatch(/guid: [a-f0-9]{32}/);
  });

  test("should handle empty sprites", () => {
    const meta = exportUnityMeta([], "empty.png", 64, 64);
    expect(meta).toContain("spriteMode: 2");
    expect(meta).toContain("sprites:");
  });
});
