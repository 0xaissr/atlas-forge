import type { SpriteRect } from "@/types";

/**
 * Strip common image extensions from a sprite name.
 */
function stripExtension(name: string): string {
  return name.replace(/\.(png|jpg|jpeg|webp|gif|bmp)$/i, "");
}

/**
 * Detect format from content and parse accordingly.
 * Supports:
 *  - TexturePacker JSON (hash and array formats)
 *  - Cocos Creator plist (XML)
 */
export function parseDataFile(content: string, fileName: string): SpriteRect[] {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return parseJSON(trimmed);
  }

  if (
    trimmed.startsWith("<?xml") ||
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<plist")
  ) {
    return parsePlist(trimmed);
  }

  throw new Error(
    `Unrecognized data file format. Expected JSON or XML/plist content.`
  );
}

function parseJSON(content: string): SpriteRect[] {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error("Invalid JSON content");
  }

  if (!data.frames) {
    throw new Error('JSON data file must contain a "frames" property');
  }

  const frames = data.frames;

  // Array format: frames is an array with filename property
  if (Array.isArray(frames)) {
    return frames.map((entry, index) => ({
      id: `data-${index}`,
      name: stripExtension(entry.filename || `sprite-${index}`),
      x: entry.frame.x,
      y: entry.frame.y,
      width: entry.frame.w,
      height: entry.frame.h,
    }));
  }

  // Hash format: frames is an object keyed by filename
  if (typeof frames === "object" && frames !== null) {
    const entries = Object.entries(frames as Record<string, { frame: { x: number; y: number; w: number; h: number } }>);
    return entries.map(([key, value], index) => ({
      id: `data-${index}`,
      name: stripExtension(key),
      x: value.frame.x,
      y: value.frame.y,
      width: value.frame.w,
      height: value.frame.h,
    }));
  }

  throw new Error("Unrecognized JSON frames format");
}

/**
 * Parse {{x,y},{w,h}} format used by Cocos Creator plist files.
 */
function parseFrameString(str: string): { x: number; y: number; w: number; h: number } {
  // Match pattern like {{0,0},{64,64}}
  const match = str.match(/\{\{(\d+),(\d+)\},\{(\d+),(\d+)\}\}/);
  if (!match) {
    throw new Error(`Cannot parse frame string: ${str}`);
  }
  return {
    x: parseInt(match[1], 10),
    y: parseInt(match[2], 10),
    w: parseInt(match[3], 10),
    h: parseInt(match[4], 10),
  };
}

function parsePlist(content: string): SpriteRect[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/xml");

  // Check for parsing errors
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error("Invalid XML/plist content");
  }

  // Navigate: plist > dict > (find "frames" key) > dict (the frames dict)
  const rootDict = doc.querySelector("plist > dict");
  if (!rootDict) {
    throw new Error("Invalid plist structure: missing root dict");
  }

  // Find the "frames" key and its corresponding dict
  const framesDict = findValueForKey(rootDict, "frames");
  if (!framesDict || framesDict.tagName !== "dict") {
    throw new Error('Invalid plist structure: missing "frames" dict');
  }

  const sprites: SpriteRect[] = [];
  const children = Array.from(framesDict.children);
  let index = 0;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.tagName === "key") {
      const spriteName = child.textContent || "";
      const spriteDict = children[i + 1];
      if (spriteDict && spriteDict.tagName === "dict") {
        const frameEl = findValueForKey(spriteDict, "frame");
        if (frameEl && frameEl.textContent) {
          const frame = parseFrameString(frameEl.textContent);
          sprites.push({
            id: `data-${index}`,
            name: stripExtension(spriteName),
            x: frame.x,
            y: frame.y,
            width: frame.w,
            height: frame.h,
          });
          index++;
        }
      }
    }
  }

  if (sprites.length === 0) {
    throw new Error("No sprites found in plist file");
  }

  return sprites;
}

/**
 * In a plist dict element, find the value element following a <key> with the given name.
 */
function findValueForKey(dictEl: Element, keyName: string): Element | null {
  const children = Array.from(dictEl.children);
  for (let i = 0; i < children.length; i++) {
    if (children[i].tagName === "key" && children[i].textContent === keyName) {
      return children[i + 1] || null;
    }
  }
  return null;
}
