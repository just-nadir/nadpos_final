const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../../waiter-pwa/dist');
const destDir = path.join(__dirname, '../mobile-dist');

// Papkani tozalash
if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir, { recursive: true });

// Nusxalash funksiyasi
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

try {
    if (!fs.existsSync(srcDir)) {
        console.error("❌ Xato: waiter-pwa/dist papkasi topilmadi!");
        console.error("   Avval 'npm run build' ni waiter-pwa papkasida bajaring.");
        process.exit(1);
    }

    console.log(`📂 Nusxalanmoqda: ${srcDir} -> ${destDir}`);
    copyRecursiveSync(srcDir, destDir);
    console.log("✅ Ofitsiant PWA muvaffaqiyatli ko'chirildi!");
} catch (err) {
    console.error("❌ Xatolik yuz berdi:", err);
    process.exit(1);
}
