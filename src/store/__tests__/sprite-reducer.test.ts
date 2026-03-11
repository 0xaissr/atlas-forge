import { describe, it, expect } from "vitest";
import { spriteReducer } from "../sprite-context";
import type { SpriteRect } from "@/types";

const makeSpriteRect = (overrides: Partial<SpriteRect> = {}): SpriteRect => ({
  id: "sprite-1",
  name: "frame_0",
  x: 0,
  y: 0,
  width: 32,
  height: 32,
  ...overrides,
});

describe("spriteReducer", () => {
  describe("SET_SPRITES", () => {
    it("sets sprites array", () => {
      const sprites = [makeSpriteRect(), makeSpriteRect({ id: "sprite-2", name: "frame_1" })];
      const result = spriteReducer([], { type: "SET_SPRITES", sprites });
      expect(result).toEqual(sprites);
    });

    it("replaces existing sprites", () => {
      const initial = [makeSpriteRect()];
      const newSprites = [makeSpriteRect({ id: "sprite-3", name: "frame_2" })];
      const result = spriteReducer(initial, { type: "SET_SPRITES", sprites: newSprites });
      expect(result).toEqual(newSprites);
    });
  });

  describe("DELETE_SPRITE", () => {
    it("removes sprite by id", () => {
      const initial = [
        makeSpriteRect({ id: "a" }),
        makeSpriteRect({ id: "b" }),
        makeSpriteRect({ id: "c" }),
      ];
      const result = spriteReducer(initial, { type: "DELETE_SPRITE", id: "b" });
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id)).toEqual(["a", "c"]);
    });

    it("does nothing if id does not exist", () => {
      const initial = [makeSpriteRect({ id: "a" })];
      const result = spriteReducer(initial, { type: "DELETE_SPRITE", id: "nonexistent" });
      expect(result).toEqual(initial);
    });
  });

  describe("UPDATE_SPRITE", () => {
    it("updates sprite properties by id", () => {
      const initial = [makeSpriteRect({ id: "a", x: 0, y: 0 })];
      const result = spriteReducer(initial, {
        type: "UPDATE_SPRITE",
        id: "a",
        updates: { x: 10, y: 20 },
      });
      expect(result[0].x).toBe(10);
      expect(result[0].y).toBe(20);
      expect(result[0].width).toBe(32); // unchanged
    });

    it("does nothing if id does not exist", () => {
      const initial = [makeSpriteRect({ id: "a" })];
      const result = spriteReducer(initial, {
        type: "UPDATE_SPRITE",
        id: "nonexistent",
        updates: { x: 99 },
      });
      expect(result).toEqual(initial);
    });
  });

  describe("RENAME_SPRITE", () => {
    it("renames sprite by id", () => {
      const initial = [makeSpriteRect({ id: "a", name: "old_name" })];
      const result = spriteReducer(initial, {
        type: "RENAME_SPRITE",
        id: "a",
        name: "new_name",
      });
      expect(result[0].name).toBe("new_name");
    });

    it("does nothing if id does not exist", () => {
      const initial = [makeSpriteRect({ id: "a", name: "old_name" })];
      const result = spriteReducer(initial, {
        type: "RENAME_SPRITE",
        id: "nonexistent",
        name: "new_name",
      });
      expect(result).toEqual(initial);
    });
  });
});
