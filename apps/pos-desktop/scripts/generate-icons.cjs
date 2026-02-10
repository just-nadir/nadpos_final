/**
 * Logo.png dan barcha PNG iconlarni yaratadi:
 * - pos-desktop/icon.png (512x512) — Electron oyna va installer uchun
 * - waiter-pwa/public/icon.png, icon-192.png, icon-512.png — PWA va favicon
 * - barcha app public/icon.png — favicon uchun
 * Ishga tushirish: npm run generate-icons (pos-desktop papkasida)
 */
const fs = require('fs');
const path = require('path');

const monorepoRoot = path.join(__dirname, '../../..');
const logoPng = path.join(monorepoRoot, 'Logo.png');
const posDesktopDir = path.join(__dirname, '..');
const waiterPublicDir = path.join(monorepoRoot, 'apps', 'waiter-pwa', 'public');
const appsPublicDirs = [
  path.join(monorepoRoot, 'apps', 'pos-desktop', 'public'),
  path.join(monorepoRoot, 'apps', 'waiter-pwa', 'public'),
  path.join(monorepoRoot, 'apps', 'super-admin', 'public'),
  path.join(monorepoRoot, 'apps', 'restaurant-admin', 'public'),
  path.join(monorepoRoot, 'apps', 'landing-page', 'public')
];

if (!fs.existsSync(logoPng)) {
  console.error('❌ Logo.png topilmadi:', logoPng);
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

  const logoBuffer = fs.readFileSync(logoPng);
  const sharpLogo = sharp(logoBuffer);

  try {
    await sharpLogo
      .clone()
      .resize(512, 512)
      .png()
      .toFile(path.join(posDesktopDir, 'icon.png'));
    console.log('✅ icon.png (512) yaratildi: pos-desktop/icon.png');
  } catch (err) {
    console.error('❌ icon.png yaratishda xato:', err.message);
    process.exit(1);
  }

  if (fs.existsSync(waiterPublicDir)) {
    try {
      await sharpLogo.clone().resize(192, 192).png().toFile(path.join(waiterPublicDir, 'icon-192.png'));
      console.log('✅ icon-192.png: waiter-pwa/public/');
    } catch (err) {
      console.error('❌ icon-192.png xato:', err.message);
    }
    try {
      await sharpLogo.clone().resize(512, 512).png().toFile(path.join(waiterPublicDir, 'icon-512.png'));
      console.log('✅ icon-512.png: waiter-pwa/public/');
    } catch (err) {
      console.error('❌ icon-512.png xato:', err.message);
    }
    try {
      await sharpLogo.clone().resize(512, 512).png().toFile(path.join(waiterPublicDir, 'icon.png'));
      console.log('✅ icon.png: waiter-pwa/public/');
    } catch (err) {
      console.error('❌ icon.png (waiter) xato:', err.message);
    }
  }

  for (const dir of appsPublicDirs) {
    if (!fs.existsSync(dir)) continue;
    const out = path.join(dir, 'icon.png');
    if (out === path.join(posDesktopDir, 'icon.png')) continue;
    if (out === path.join(waiterPublicDir, 'icon.png')) continue;
    try {
      await sharpLogo.clone().resize(512, 512).png().toFile(out);
      console.log('✅ icon.png:', path.relative(monorepoRoot, out));
    } catch (err) {
      console.error('❌', out, err.message);
    }
  }
}

run();
