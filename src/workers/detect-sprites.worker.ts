import { detectSprites } from "@/lib/detect-sprites";

export interface DetectSpritesMessage {
  imageData: ArrayBuffer;
  width: number;
  height: number;
  alphaThreshold: number;
  padding: number;
  fileName: string;
}

self.addEventListener("message", (event: MessageEvent<DetectSpritesMessage>) => {
  const { imageData, width, height, alphaThreshold, padding, fileName } =
    event.data;

  // Extract alpha channel from RGBA data
  const rgba = new Uint8Array(imageData);
  const totalPixels = width * height;
  const alphaData = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    alphaData[i] = rgba[i * 4 + 3]; // alpha is every 4th byte, offset 3
  }

  const sprites = detectSprites(alphaData, width, height, alphaThreshold, padding);

  // Update names to use fileName
  sprites.forEach((sprite, index) => {
    sprite.name = `${fileName}-${index}`;
  });

  self.postMessage(sprites);
});
