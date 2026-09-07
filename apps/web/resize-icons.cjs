const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const logoPath = path.resolve(__dirname, 'public/cognerix-logo.png');
const base = path.resolve(__dirname, 'android/app/src/main/res');

const launcherSizes = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

const foregroundSizes = [
  { dir: 'mipmap-mdpi', canvas: 108, logoSize: 72 },
  { dir: 'mipmap-hdpi', canvas: 162, logoSize: 108 },
  { dir: 'mipmap-xhdpi', canvas: 216, logoSize: 144 },
  { dir: 'mipmap-xxhdpi', canvas: 324, logoSize: 216 },
  { dir: 'mipmap-xxxhdpi', canvas: 432, logoSize: 288 },
];

console.log('Logo path:', logoPath);
console.log('Base path:', base);

async function resizeIcons() {
  for (const { dir, size } of launcherSizes) {
    const targetDir = path.join(base, dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    await sharp(logoPath).resize(size, size).toFile(path.join(targetDir, 'ic_launcher.png'));
    await sharp(logoPath).resize(size, size).toFile(path.join(targetDir, 'ic_launcher_round.png'));
    console.log('Resized launcher icons for ' + dir + ' (' + size + 'x' + size + ')');
  }

  for (const { dir, canvas, logoSize } of foregroundSizes) {
    const targetDir = path.join(base, dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const offset = Math.floor((canvas - logoSize) / 2);
    await sharp(logoPath)
      .resize(logoSize, logoSize)
      .extend({ top: offset, bottom: offset, left: offset, right: offset, background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));
    console.log('Resized foreground icon for ' + dir + ' (canvas: ' + canvas + ', logo: ' + logoSize + ')');
  }

  console.log('SUCCESS: All Android icons resized cleanly!');
}

resizeIcons().catch(err => {
  console.error('Error resizing icons:', err);
  process.exit(1);
});