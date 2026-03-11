import type { SpriteRect } from "../types";

export function exportCocosPlist(
  sprites: SpriteRect[],
  textureFileName: string,
  imageWidth: number,
  imageHeight: number
): string {
  const framesEntries = sprites
    .map((sprite) => {
      const textureRect = `{{${sprite.x},${sprite.y}},{${sprite.width},${sprite.height}}}`;
      const spriteSize = `{${sprite.width},${sprite.height}}`;
      const spriteSourceSize = `{${sprite.width},${sprite.height}}`;
      return `        <key>${sprite.name}.png</key>
        <dict>
            <key>aliases</key>
            <array/>
            <key>spriteOffset</key>
            <string>{0,0}</string>
            <key>spriteSize</key>
            <string>${spriteSize}</string>
            <key>spriteSourceSize</key>
            <string>${spriteSourceSize}</string>
            <key>textureRect</key>
            <string>${textureRect}</string>
            <key>textureRotated</key>
            <false/>
        </dict>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>frames</key>
    <dict>
${framesEntries}
    </dict>
    <key>metadata</key>
    <dict>
        <key>format</key>
        <integer>3</integer>
        <key>realTextureFileName</key>
        <string>${textureFileName}</string>
        <key>size</key>
        <string>{${imageWidth},${imageHeight}}</string>
        <key>textureFileName</key>
        <string>${textureFileName}</string>
    </dict>
</dict>
</plist>`;
}
