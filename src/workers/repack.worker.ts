import { repackAtlas } from "../lib/repack-atlas";
import type { SpriteRect } from "../types";

export interface RepackWorkerMessage {
  sprites: SpriteRect[];
  imageData: ImageBitmap;
  maxSize: number;
  padding: number;
  trim: boolean;
}

export interface RepackWorkerResult {
  imageBlob: Blob;
  sprites: SpriteRect[];
  width: number;
  height: number;
  overflow: string[];
}

self.addEventListener(
  "message",
  async (event: MessageEvent<RepackWorkerMessage>) => {
    const { sprites, imageData, maxSize, padding, trim } = event.data;

    try {
      const result = await repackAtlas({
        sprites,
        sourceImage: imageData,
        maxSize,
        padding,
        trim,
      });

      const response: RepackWorkerResult = {
        imageBlob: result.imageBlob,
        sprites: result.sprites,
        width: result.width,
        height: result.height,
        overflow: result.overflow,
      };

      self.postMessage(response);
    } catch (error) {
      self.postMessage({
        error: error instanceof Error ? error.message : "Repack failed",
      });
    }
  }
);
