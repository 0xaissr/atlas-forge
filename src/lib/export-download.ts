import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { SpriteRect, ExportSettings } from "@/types";
import { exportCocosPlist } from "./export-cocos";
import { exportUnityMeta } from "./export-unity";
import { repackAtlas } from "./repack-atlas";

export interface DownloadOptions {
  sprites: SpriteRect[];
  image: HTMLImageElement;
  fileName: string; // original file name without extension
  settings: ExportSettings;
}

export interface DownloadResult {
  success: boolean;
  error?: string;
  overflow?: string[];
}

export async function downloadAtlas(
  options: DownloadOptions
): Promise<DownloadResult> {
  const { sprites, image, fileName, settings } = options;
  const zip = new JSZip();

  let atlasImage: Blob;
  let atlasSprites: SpriteRect[];
  let atlasWidth: number;
  let atlasHeight: number;
  let overflow: string[] = [];

  try {
    if (settings.mode === "repack") {
      const imageBitmap = await createImageBitmap(image);
      const result = await repackAtlas({
        sprites,
        sourceImage: imageBitmap,
        maxSize: settings.maxSize,
        padding: settings.padding,
        trim: settings.trim,
      });
      imageBitmap.close();

      atlasImage = result.imageBlob;
      atlasSprites = result.sprites;
      atlasWidth = result.width;
      atlasHeight = result.height;
      overflow = result.overflow;
    } else {
      // Original mode: use the original image as-is
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return { success: false, error: "Failed to create canvas context" };
      }
      ctx.drawImage(image, 0, 0);
      atlasImage = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to export canvas to PNG"));
        }, "image/png");
      });
      atlasSprites = sprites;
      atlasWidth = image.naturalWidth;
      atlasHeight = image.naturalHeight;
    }

    const baseName = fileName.replace(/\.[^.]+$/, "");
    const pngFileName = `${baseName}.png`;
    zip.file(pngFileName, atlasImage);

    if (settings.engine === "cocos") {
      const plist = exportCocosPlist(
        atlasSprites,
        pngFileName,
        atlasWidth,
        atlasHeight
      );
      zip.file(`${baseName}.plist`, plist);
    } else {
      const meta = exportUnityMeta(
        atlasSprites,
        pngFileName,
        atlasWidth,
        atlasHeight
      );
      zip.file(`${pngFileName}.meta`, meta);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${baseName}_${settings.engine}.zip`);

    return { success: true, overflow };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Export failed",
    };
  }
}
