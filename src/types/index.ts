export interface SpriteRect {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteSheet {
  image: HTMLImageElement;
  fileName: string;
  width: number;
  height: number;
}

export type SplitMode = "grid" | "rectangular" | "datafile";

export interface GridSettings {
  cellWidth: number;
  cellHeight: number;
  offsetX: number;
  offsetY: number;
  spacing: number;
  filterEmpty: boolean;
}

export interface RectangularSettings {
  padding: number;
  alphaThreshold: number;
}

export type ExportEngine = "cocos" | "unity";
export type ExportMode = "original" | "repack";

export interface ExportSettings {
  engine: ExportEngine;
  mode: ExportMode;
  maxSize: 1024 | 2048 | 4096;
  padding: number;
  trim: boolean;
}

export type SpriteAction =
  | { type: "SET_SPRITES"; sprites: SpriteRect[] }
  | { type: "DELETE_SPRITE"; id: string }
  | { type: "UPDATE_SPRITE"; id: string; updates: Partial<SpriteRect> }
  | { type: "RENAME_SPRITE"; id: string; name: string };
