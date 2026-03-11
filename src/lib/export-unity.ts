import type { SpriteRect } from "@/types";

function generateGuid(): string {
  const hex = "0123456789abcdef";
  let guid = "";
  for (let i = 0; i < 32; i++) {
    guid += hex[Math.floor(Math.random() * 16)];
  }
  return guid;
}

export function exportUnityMeta(
  sprites: SpriteRect[],
  textureFileName: string,
  imageWidth: number,
  imageHeight: number
): string {
  const guid = generateGuid();

  const spriteEntries = sprites
    .map((sprite) => {
      const unityY = imageHeight - sprite.y - sprite.height;
      return [
        `      - serializedVersion: 2`,
        `        name: ${sprite.name}`,
        `        rect:`,
        `          serializedVersion: 2`,
        `          x: ${sprite.x}`,
        `          y: ${unityY}`,
        `          width: ${sprite.width}`,
        `          height: ${sprite.height}`,
        `        alignment: 0`,
        `        pivot: {x: 0.5, y: 0.5}`,
        `        border: {x: 0, y: 0, z: 0, w: 0}`,
      ].join("\n");
    })
    .join("\n");

  const meta = [
    `fileFormatVersion: 2`,
    `guid: ${guid}`,
    `TextureImporter:`,
    `  fileIDToRecycleName: {}`,
    `  serializedVersion: 4`,
    `  mipmaps:`,
    `    mipMapMode: 0`,
    `    enableMipMap: 0`,
    `  bumpmap:`,
    `    convertToNormalMap: 0`,
    `  isReadable: 1`,
    `  grayScaleToAlpha: 0`,
    `  generateCubemap: 0`,
    `  filterMode: 1`,
    `  maxTextureSize: 2048`,
    `  textureFormat: -1`,
    `  textureCompression: 1`,
    `  spriteMode: 2`,
    `  spritePixelsToUnits: 100`,
    `  spriteSheet:`,
    `    sprites:`,
    spriteEntries,
    `  spritePackingTag: ""`,
    `  userData: ""`,
    `  assetBundleName: ""`,
    `  textureFileName: ${textureFileName}`,
  ];

  return meta.join("\n") + "\n";
}
