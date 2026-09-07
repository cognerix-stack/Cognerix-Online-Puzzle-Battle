const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const logo = path.resolve(__dirname, 'public/cognerix-logo.png');
const base = path.resolve(__dirname, 'android/app/src/main/res');

const sizes = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

console.log('Logo path:', logo);
console.log('Base path:', base);

async function resizeIcons() {
  for (const { dir, size } of sizes) {
    const targetDir = path.join(base, dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    await sharp(logo).resize(size, size).toFile(path.join(targetDir, 'ic_launcher.png'));
    await sharp(logo).resize(size, size).toFile(path.join(targetDir, 'ic_launcher_round.png'));
    console.log('Resized for ' + dir + ' (' + size + 'x' + size + ')');
  }
  console.log('SUCCESS: All Android icons resized cleanly!');
}

resizeIcons().catch(err => {
  console.error('Error resizing icons:', err);
  process.exit(1);
});