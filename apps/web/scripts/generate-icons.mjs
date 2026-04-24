import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PUBLIC = resolve(ROOT, "public");
const BRAND = resolve(PUBLIC, "brand");
const APP = resolve(ROOT, "src", "app");

const ICON_SRC = resolve(BRAND, "icon.png");
const LOGO_SRC = resolve(BRAND, "logo.png");

const BRAND_COLOR = process.env.BRAND_COLOR ?? "#1171B0";
const ICON_FG = process.env.ICON_FG ?? "#FFFFFF";
const ICON_BG = process.env.ICON_BG ?? BRAND_COLOR;
const LOGO_FG = process.env.LOGO_FG ?? BRAND_COLOR;

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

async function ensure(dir) {
  await mkdir(dir, { recursive: true });
}

async function recolor(src, hex) {
  const { width, height } = await sharp(src).metadata();
  const { r, g, b } = hexToRgb(hex);
  const alphaRaw = await sharp(src)
    .flatten({ background: "#ffffff" })
    .extractChannel("red")
    .negate()
    .raw()
    .toBuffer();
  return sharp({
    create: { width, height, channels: 3, background: { r, g, b } },
  })
    .joinChannel(alphaRaw, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();
}

async function trim(input) {
  return sharp(input).trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
}

async function padToSquare(buffer, size, background) {
  const img = sharp(buffer);
  const meta = await img.metadata();
  const side = Math.max(meta.width, meta.height);
  const squared = await sharp({
    create: { width: side, height: side, channels: 4, background },
  })
    .composite([
      {
        input: buffer,
        top: Math.floor((side - meta.height) / 2),
        left: Math.floor((side - meta.width) / 2),
      },
    ])
    .png()
    .toBuffer();
  return sharp(squared).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
}

async function padMaskable(buffer, size, background, safeZone = 0.8) {
  const inner = Math.round(size * safeZone);
  const resized = await sharp(buffer)
    .resize(inner, inner, { fit: "contain", background })
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: resized, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  await ensure(PUBLIC);
  await ensure(APP);

  console.log(`Recoloring icon.png → ${ICON_FG} on ${ICON_BG}…`);
  const iconRecolored = await recolor(ICON_SRC, ICON_FG);

  console.log("Trimming recolored icon…");
  const { data: iconTrimmed, info: iconInfo } = await trim(iconRecolored);
  console.log(`  icon trimmed: ${iconInfo.width}×${iconInfo.height}`);

  // Favicon (src/app/icon.png) uses the brand color on transparent so it reads
  // on both light and dark browser chrome.
  const faviconRecolored = await recolor(ICON_SRC, LOGO_FG);
  const { data: faviconTrimmed } = await trim(faviconRecolored);

  console.log(`Recoloring logo.png → ${LOGO_FG}…`);
  const logoRecolored = await recolor(LOGO_SRC, LOGO_FG);

  console.log("Trimming recolored logo…");
  const { data: logoTrimmed, info: logoInfo } = await trim(logoRecolored);
  console.log(`  logo trimmed: ${logoInfo.width}×${logoInfo.height}`);

  const iconBg = { ...hexToRgb(ICON_BG), alpha: 1 };
  const transparent = { r: 255, g: 255, b: 255, alpha: 0 };

  const outputs = [
    { name: "icon-192x192.png", path: PUBLIC, buf: await padToSquare(iconTrimmed, 192, iconBg) },
    { name: "icon-512x512.png", path: PUBLIC, buf: await padToSquare(iconTrimmed, 512, iconBg) },
    { name: "icon-maskable-512.png", path: PUBLIC, buf: await padMaskable(iconTrimmed, 512, iconBg, 0.7) },
    { name: "apple-icon.png", path: APP, buf: await padMaskable(iconTrimmed, 180, iconBg, 0.75) },
    { name: "icon.png", path: APP, buf: await padToSquare(faviconTrimmed, 64, transparent) },
  ];

  for (const o of outputs) {
    const outPath = resolve(o.path, o.name);
    await sharp(o.buf).toFile(outPath);
    console.log(`  wrote ${outPath} (${(o.buf.length / 1024).toFixed(1)} KB)`);
  }

  const logoOut = resolve(BRAND, "logo-trimmed.png");
  await sharp(logoTrimmed).png({ compressionLevel: 9 }).toFile(logoOut);
  console.log(`  wrote ${logoOut}`);

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
