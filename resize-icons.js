const sharp = require('sharp');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const logo = path.join(repoRoot, 'apps/web/public/cognerix-logo.png');
const base = path.join(repoRoot, 'apps/web/android/app/src/main/res');

const sizes = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

sizes.forEach(({ dir, size }) => {
  const targetDir = path.join(base, dir);
  sharp(logo).resize(size, size).toFile(path.join(targetDir, 'ic_launcher.png'));
  sharp(logo).resize(size, size).toFile(path.join(targetDir, 'ic_launcher_round.png'));
});
console.log('Android icons resized successfully!');