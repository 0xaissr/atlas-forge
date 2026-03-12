import type { SpriteRect } from "@/types";

export interface SplitGridParams {
  imageWidth: number;
  imageHeight: number;
  cellWidth: number;
  cellHeight: number;
  offsetX: number;
  offsetY: number;
  spacingX: number;
  spacingY: number;
  fileName: string;
}

/**
 * Pure function that splits an image into a grid of sprite rectangles.
 * Iterates row by row, left to right. Skips cells that extend beyond image boundaries.
 */
export function splitGrid(params: SplitGridParams): SpriteRect[] {
  const {
    imageWidth,
    imageHeight,
    cellWidth,
    cellHeight,
    offsetX,
    offsetY,
    spacingX,
    spacingY,
    fileName,
  } = params;

  const sprites: SpriteRect[] = [];
  let index = 0;

  for (let y = offsetY; y + cellHeight <= imageHeight; y += cellHeight + spacingY) {
    for (let x = offsetX; x + cellWidth <= imageWidth; x += cellWidth + spacingX) {
      sprites.push({
        id: `grid-${index}`,
        name: `${fileName}-${index}`,
        x,
        y,
        width: cellWidth,
        height: cellHeight,
      });
      index++;
    }
  }

  return sprites;
}
