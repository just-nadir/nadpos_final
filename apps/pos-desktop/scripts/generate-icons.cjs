/**
 * icon.svg dan PNG iconlar yaratadi:
 * - pos-desktop/icon.png (512x512) — Electron oyna va installer uchun
 * - waiter-pwa/public/icon-192.png, icon-512.png — PWA manifest uchun
 * Ishga tushirish: npm run generate-icons (pos-desktop papkasida)
 */
const fs = require('fs');
const path = require('path');

const monorepoRoot = path.join(__dirname, '../../..');
const iconSvg = path.join(monorepoRoot, 'icon.svg');
const posDesktopDir = path.join(__dirname, '..');
const waiterPublicDir = path.join(monorepoRoot, 'apps', 'waiter-pwa', 'public');

if (!fs.existsSync(iconSvg)) {
  console.error('❌ icon.svg topilmadi:', iconSvg);
  process.exit(1);
}

async function run() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.error('❌ sharp o\'rnatilmagan. O\'rnating: npm install -D sharp');
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(iconSvg);

  try {
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(posDesktopDir, 'icon.png'));
    console.log('✅ icon.png (512) yaratildi: pos-desktop/icon.png');
  } catch (err) {
    console.error('❌ icon.png yaratishda xato:', err.message);
    process.exit(1);
  }

  if (!fs.existsSync(waiterPublicDir)) {
    console.log('⚠️ waiter-pwa/public topilmadi, PWA iconlar o\'tkazib yuborildi.');
    return;
  }

  try {
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(waiterPublicDir, 'icon-192.png'));
    console.log('✅ icon-192.png yaratildi: waiter-pwa/public/');
  } catch (err) {
    console.error('❌ icon-192.png xato:', err.message);
  }

  try {
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(waiterPublicDir, 'icon-512.png'));
    console.log('✅ icon-512.png yaratildi: waiter-pwa/public/');
  } catch (err) {
    console.error('❌ icon-512.png xato:', err.message);
  }
}

run();
