import { SpriteRect } from "@/types";

export function filterEmptySprites(imageData: ImageData, sprites: SpriteRect[]): SpriteRect[] {
  return sprites.filter(sprite => {
    // Check if any pixel in sprite region has alpha > 0
    for (let y = sprite.y; y < sprite.y + sprite.height; y++) {
      for (let x = sprite.x; x < sprite.x + sprite.width; x++) {
        const alphaIndex = (y * imageData.width + x) * 4 + 3;
        if (imageData.data[alphaIndex] > 0) {
          return true; // Has at least one non-transparent pixel
        }
      }
    }
    return false; // Fully transparent
  });
}
