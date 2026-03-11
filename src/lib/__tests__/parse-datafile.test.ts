import { describe, test, expect } from "vitest";
import { parseDataFile } from "../parse-datafile";

const TP_JSON_HASH = JSON.stringify({
  frames: {
    "coin-0.png": {
      frame: { x: 0, y: 0, w: 64, h: 64 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
      sourceSize: { w: 64, h: 64 },
    },
    "coin-1.png": {
      frame: { x: 64, y: 0, w: 64, h: 64 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
      sourceSize: { w: 64, h: 64 },
    },
  },
  meta: {
    image: "coins.png",
    size: { w: 128, h: 64 },
  },
});

const TP_JSON_ARRAY = JSON.stringify({
  frames: [
    {
      filename: "coin-0.png",
      frame: { x: 0, y: 0, w: 64, h: 64 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
      sourceSize: { w: 64, h: 64 },
    },
    {
      filename: "hero-idle.png",
      frame: { x: 64, y: 0, w: 32, h: 48 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 32, h: 48 },
      sourceSize: { w: 32, h: 48 },
    },
  ],
});

const COCOS_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>frames</key>
  <dict>
    <key>coin-0.png</key>
    <dict>
      <key>frame</key>
      <string>{{0,0},{64,64}}</string>
      <key>offset</key>
      <string>{0,0}</string>
      <key>rotated</key>
      <false/>
      <key>sourceColorRect</key>
      <string>{{0,0},{64,64}}</string>
      <key>sourceSize</key>
      <string>{64,64}</string>
    </dict>
    <key>coin-1.png</key>
    <dict>
      <key>frame</key>
      <string>{{80,10},{48,48}}</string>
      <key>offset</key>
      <string>{0,0}</string>
      <key>rotated</key>
      <false/>
      <key>sourceColorRect</key>
      <string>{{0,0},{48,48}}</string>
      <key>sourceSize</key>
      <string>{48,48}</string>
    </dict>
  </dict>
  <key>metadata</key>
  <dict>
    <key>format</key>
    <integer>2</integer>
    <key>textureFileName</key>
    <string>coins.png</string>
  </dict>
</dict>
</plist>`;

describe("parseDataFile", () => {
  describe("TexturePacker JSON (hash format)", () => {
    test("should parse correct number of sprites", () => {
      const result = parseDataFile(TP_JSON_HASH, "coins.json");
      expect(result).toHaveLength(2);
    });

    test("should parse sprite positions and sizes correctly", () => {
      const result = parseDataFile(TP_JSON_HASH, "coins.json");
      expect(result[0]).toMatchObject({
        name: "coin-0",
        x: 0,
        y: 0,
        width: 64,
        height: 64,
      });
      expect(result[1]).toMatchObject({
        name: "coin-1",
        x: 64,
        y: 0,
        width: 64,
        height: 64,
      });
    });

    test("should generate unique IDs with data- prefix", () => {
      const result = parseDataFile(TP_JSON_HASH, "coins.json");
      expect(result[0].id).toBe("data-0");
      expect(result[1].id).toBe("data-1");
    });

    test("should strip .png extension from names", () => {
      const result = parseDataFile(TP_JSON_HASH, "coins.json");
      expect(result[0].name).toBe("coin-0");
      expect(result[1].name).toBe("coin-1");
    });
  });

  describe("TexturePacker JSON (array format)", () => {
    test("should parse correct number of sprites", () => {
      const result = parseDataFile(TP_JSON_ARRAY, "sprites.json");
      expect(result).toHaveLength(2);
    });

    test("should parse sprite positions and sizes correctly", () => {
      const result = parseDataFile(TP_JSON_ARRAY, "sprites.json");
      expect(result[0]).toMatchObject({
        name: "coin-0",
        x: 0,
        y: 0,
        width: 64,
        height: 64,
      });
      expect(result[1]).toMatchObject({
        name: "hero-idle",
        x: 64,
        y: 0,
        width: 32,
        height: 48,
      });
    });
  });

  describe("Cocos Creator plist (XML)", () => {
    test("should parse correct number of sprites", () => {
      const result = parseDataFile(COCOS_PLIST, "coins.plist");
      expect(result).toHaveLength(2);
    });

    test("should parse sprite positions and sizes correctly", () => {
      const result = parseDataFile(COCOS_PLIST, "coins.plist");
      expect(result[0]).toMatchObject({
        name: "coin-0",
        x: 0,
        y: 0,
        width: 64,
        height: 64,
      });
      expect(result[1]).toMatchObject({
        name: "coin-1",
        x: 80,
        y: 10,
        width: 48,
        height: 48,
      });
    });

    test("should generate unique IDs", () => {
      const result = parseDataFile(COCOS_PLIST, "coins.plist");
      const ids = result.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("Cocos Creator plist format 3 (XML)", () => {
    const FORMAT3_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>frames</key>
  <dict>
    <key>coin-0</key>
    <dict>
      <key>aliases</key>
      <array/>
      <key>spriteOffset</key>
      <string>{0,0}</string>
      <key>spriteSize</key>
      <string>{64,64}</string>
      <key>spriteSourceSize</key>
      <string>{64,64}</string>
      <key>textureRect</key>
      <string>{{0,0},{64,64}}</string>
      <key>textureRotated</key>
      <false/>
    </dict>
    <key>coin-1</key>
    <dict>
      <key>aliases</key>
      <array/>
      <key>spriteOffset</key>
      <string>{0,0}</string>
      <key>spriteSize</key>
      <string>{48,48}</string>
      <key>spriteSourceSize</key>
      <string>{48,48}</string>
      <key>textureRect</key>
      <string>{{80,10},{48,48}}</string>
      <key>textureRotated</key>
      <false/>
    </dict>
  </dict>
  <key>metadata</key>
  <dict>
    <key>format</key>
    <integer>3</integer>
    <key>textureFileName</key>
    <string>coins.png</string>
  </dict>
</dict>
</plist>`;

    test("should parse correct number of sprites", () => {
      const result = parseDataFile(FORMAT3_PLIST, "coins.plist");
      expect(result).toHaveLength(2);
    });

    test("should parse sprite positions and sizes from textureRect", () => {
      const result = parseDataFile(FORMAT3_PLIST, "coins.plist");
      expect(result[0]).toMatchObject({
        name: "coin-0",
        x: 0,
        y: 0,
        width: 64,
        height: 64,
      });
      expect(result[1]).toMatchObject({
        name: "coin-1",
        x: 80,
        y: 10,
        width: 48,
        height: 48,
      });
    });
  });

  describe("auto-detection", () => {
    test("should detect JSON format from content starting with {", () => {
      const result = parseDataFile(TP_JSON_HASH, "data.txt");
      expect(result).toHaveLength(2);
    });

    test("should detect XML/plist format from content starting with <?xml", () => {
      const result = parseDataFile(COCOS_PLIST, "data.txt");
      expect(result).toHaveLength(2);
    });
  });

  describe("error handling", () => {
    test("should throw on invalid JSON", () => {
      expect(() => parseDataFile("{invalid json", "bad.json")).toThrow();
    });

    test("should throw on invalid XML", () => {
      expect(() =>
        parseDataFile("<not-a-plist>bad</not-a-plist>", "bad.plist")
      ).toThrow();
    });

    test("should throw on unrecognized format", () => {
      expect(() => parseDataFile("just plain text", "data.txt")).toThrow();
    });

    test("should throw on JSON without frames property", () => {
      expect(() =>
        parseDataFile(JSON.stringify({ notFrames: {} }), "bad.json")
      ).toThrow();
    });
  });
});
