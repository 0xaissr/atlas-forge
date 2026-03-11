import type { SpriteRect } from "../types";

export function exportCocosPlist(
  sprites: SpriteRect[],
  textureFileName: string,
  imageWidth: number,
  imageHeight: number
): string {
  const framesEntries = sprites
    .map((sprite) => {
      const frame = `{{${sprite.x},${sprite.y}},{${sprite.width},${sprite.height}}}`;
      const sourceSize = `{${sprite.width},${sprite.height}}`;
      return `            <key>${sprite.name}</key>
            <dict>
                <key>frame</key>
                <string>${frame}</string>
                <key>offset</key>
                <string>{0,0}</string>
                <key>rotated</key>
                <false/>
                <key>sourceColorRect</key>
                <string>{{0,0},{${sprite.width},${sprite.height}}}</string>
                <key>sourceSize</key>
                <string>${sourceSize}</string>
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
            <integer>2</integer>
            <key>size</key>
            <string>{${imageWidth},${imageHeight}}</string>
            <key>textureFileName</key>
            <string>${textureFileName}</string>
        </dict>
    </dict>
</plist>`;
}
