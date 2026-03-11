import { describe, test, expect } from "vitest";
import { exportCocosPlist } from "../export-cocos";

describe("exportCocosPlist", () => {
  const sprites = [
    { id: "1", name: "coin-0", x: 0, y: 0, width: 64, height: 64 },
    { id: "2", name: "coin-1", x: 64, y: 0, width: 64, height: 64 },
  ];

  test("should generate valid plist XML", () => {
    const plist = exportCocosPlist(sprites, "coins.png", 128, 64);
    expect(plist).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(plist).toContain("<plist");
    expect(plist).toContain("</plist>");
  });

  test("should include all sprite frames with .png extension", () => {
    const plist = exportCocosPlist(sprites, "coins.png", 128, 64);
    expect(plist).toContain("<key>coin-0.png</key>");
    expect(plist).toContain("<key>coin-1.png</key>");
  });

  test("should use format 3 field names", () => {
    const plist = exportCocosPlist(sprites, "coins.png", 128, 64);
    expect(plist).toContain("<key>textureRect</key>");
    expect(plist).toContain("<key>spriteOffset</key>");
    expect(plist).toContain("<key>spriteSize</key>");
    expect(plist).toContain("<key>spriteSourceSize</key>");
    expect(plist).toContain("<key>textureRotated</key>");
    expect(plist).toContain("{{0,0},{64,64}}");
    expect(plist).toContain("{{64,0},{64,64}}");
  });

  test("should include format 3 metadata", () => {
    const plist = exportCocosPlist(sprites, "coins.png", 128, 64);
    expect(plist).toContain("<key>format</key>");
    expect(plist).toContain("<integer>3</integer>");
    expect(plist).toContain("<key>textureFileName</key>");
    expect(plist).toContain("<string>coins.png</string>");
    expect(plist).toContain("<key>realTextureFileName</key>");
    expect(plist).toContain("{128,64}");
  });

  test("should handle empty sprites array", () => {
    const plist = exportCocosPlist([], "empty.png", 64, 64);
    expect(plist).toContain("<key>frames</key>");
    expect(plist).toContain("<key>metadata</key>");
  });
});
