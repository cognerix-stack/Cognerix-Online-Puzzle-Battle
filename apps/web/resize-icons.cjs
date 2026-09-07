const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const logo = path.resolve(__dirname, 'public/cognerix-logo.png');
const base = path.resolve(__dirname, 'android/app/src/main/res');

const launcherSizes = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

const foregroundSizes = [
  { dir: 'mipmap-mdpi', size: 108 },
  { dir: 'mipmap-hdpi', size: 162 },
  { dir: 'mipmap-xhdpi', size: 216 },
  { dir: 'mipmap-xxhdpi', size: 324 },
  { dir: 'mipmap-xxxhdpi', size: 432 },
];

console.log('Logo path:', logo);
console.log('Base path:', base);

async function resizeIcons() {
  for (const { dir, size } of launcherSizes) {
    const targetDir = path.join(base, dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    await sharp(logo).resize(size, size).toFile(path.join(targetDir, 'ic_launcher.png'));
    await sharp(logo).resize(size, size).toFile(path.join(targetDir, 'ic_launcher_round.png'));
    console.log('Resized launcher icons for ' + dir + ' (' + size + 'x' + size + ')');
  }

  for (const { dir, size } of foregroundSizes) {
    const targetDir = path.join(base, dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    await sharp(logo).resize(size, size).toFile(path.join(targetDir, 'ic_launcher_foreground.png'));
    console.log('Resized foreground icon for ' + dir + ' (' + size + 'x' + size + ')');
  }

  console.log('SUCCESS: All Android icons resized cleanly!');
}

resizeIcons().catch(err => {
  console.error('Error resizing icons:', err);
  process.exit(1);
});