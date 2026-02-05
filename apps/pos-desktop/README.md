# NadPOS Desktop

Ushbu ilova NadPOS tizimining desktop versiyasi bo'lib, **Electron**, **React**, **Vite** va **SQLite** texnologiyalarida qurilgan.

## Asosiy Xususiyatlar
- **Offline-first:** Internet bo'lmaganda ham ishlash imkoniyati.
- **Lokal Server:** Ichki Express server orqali printer va boshqa qurilmalar bilan aloqa.
- **Tezkor Sinxronizatsiya:** Ma'lumotlarni bulutli server bilan sinxronlash.

## O'rnatish va Ishga Tushirish

1. Bog'liqliklarni o'rnatish:
   ```bash
   npm install
   ```

2. Ilovani rivojlantirish rejimida ishga tushirish:
   ```bash
   npm run electron:dev
   ```

3. Ilovani qurish (Build):
   ```bash
   npm run dist
   ```

## Fayl Tuzilishi
- `electron/` - Asosiy Electron jarayoni (Main Process) kodlari.
- `src/` - React frontend kodlari.
- `database.cjs` - SQLite bazasi bilan ishlash.
- `server.cjs` - Lokal API server.
