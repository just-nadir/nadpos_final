# POS Desktop — Windows PC da dist uchun tayyorlash rejasi

Bu qo‘llanma **Windows** kompyuterida loyihani Git dan clone qilib, POS desktop ni boshqa PC larga tarqatish uchun **installer (.exe)** tayyorlash bo‘yicha qadamlarni bayon qiladi.

---

## Oldingi talablar

- **Windows 10/11** (64-bit)
- **Node.js** 18 yoki 20 LTS — [nodejs.org](https://nodejs.org) dan yuklab o‘ring
- **Git** — [git-scm.com](https://git-scm.com) dan yuklab o‘ring
- **Backend manzili** — VPS da ishlayotgan API manzilingiz (masalan `https://nadpos.uz/api`). Bu manzil build vaqtida ilovaga "qotiriladi".

---

## Reja (qadamlar)

### 1. Loyihani clone qilish

```bash
# Istalgan papkaga (masalan C:\Projects)
cd C:\Projects
git clone https://github.com/just-nadir/NadPOS-V2.0.0.git nadpos
cd nadpos
```

(Yoki o‘zingizning repo manzilingiz bo‘lsa, shu URL ni yozing.)

---

### 2. Monorepo dependency larni o‘rnatish

Loyiha root da barcha app lar uchun `npm install` qiling:

```bash
cd C:\Projects\nadpos
npm install
```

Bu `apps/pos-desktop` va boshqa workspace larni ham o‘rnatadi.

---

### 3. Backend manzilini aniqlash

POS desktop **qaysi server**ga ulanadi — build vaqtida belgilanadi. O‘z VPS domeningiz yoki IP manzilingizni yozing.

**Misollar:**

- `https://nadpos.uz/api` (domen + Nginx proxy)
- `https://api.meningrestoran.uz` (alohida API subdomen)
- `http://123.45.67.89:3000` (to‘g‘ridan-to‘g‘ri IP va port — faqat test uchun)

Bu manzil **VITE_API_URL** orqali beriladi.

---

### 4. POS desktop ni build qilish (Vite)

Avval faqat **veb qismini** build qilamiz (Electron bundan foydalanadi):

```bash
cd C:\Projects\nadpos\apps\pos-desktop

set VITE_API_URL=https://nadpos.uz/api
npm run build
```

**PowerShell** da o‘rniga:

```powershell
$env:VITE_API_URL="https://nadpos.uz/api"
npm run build
```

`nadpos.uz/api` o‘rniga o‘zingizning backend manzilingizni yozing. Build muvaffaqiyatli bo‘lsa, `dist` papka paydo bo‘ladi.

---

### 5. Windows installer (.exe) yaratish

Electron Builder yordamida **NSIS installer** chiqarish:

```bash
cd C:\Projects\nadpos\apps\pos-desktop

set VITE_API_URL=https://nadpos.uz/api
npm run dist:win
```

**PowerShell:**

```powershell
$env:VITE_API_URL="https://nadpos.uz/api"
npm run dist:win
```

Bir necha daqiqa kutiladi. Natija:

- **Papka:** `apps/pos-desktop/release/`
- **Fayl:** `NadPOS-Restoran-Setup-2.2.3.exe` (versiya `package.json` dagi `version` dan)

---

### 6. Dist ni tarqatish

- `NadPOS-Restoran-Setup-*.exe` ni restoranlar PC lariga **yuklab olish** uchun qo‘ying (Google Drive, Dropbox, file server, GitHub Releases va h.k.).
- Har bir Windows PC da setup ni ishga tushiring, o‘rnatish tugagach dasturni oching.
- **Telefon** va **parol**ni (super-admin da yaratilgan restoran hisobi) kiriting — tizim VPS dagi backend ga ulanadi va sinxronizatsiya ishlaydi.

---

## Tezkor buyruqlar (barchasini ketma-ket)

**CMD (Command Prompt):**

```batch
cd C:\Projects\nadpos
npm install
cd apps\pos-desktop
set VITE_API_URL=https://nadpos.uz/api
npm run dist:win
```

**PowerShell:**

```powershell
cd C:\Projects\nadpos
npm install
cd apps\pos-desktop
$env:VITE_API_URL="https://nadpos.uz/api"
npm run dist:win
```

Keyin `release\NadPOS-Restoran-Setup-*.exe` ni oching va tarqating.

---

## Muammolar va tekshirish

| Muammo | Tekshirish |
|--------|------------|
| `npm install` xato | Node.js versiyasi: `node -v` (18+ yoki 20 LTS). |
| `electron-builder` xato | `apps\pos-desktop` da: `npm run install:deps` (Electron native modullar). |
| Build da `VITE_API_URL` ishlamayapti | Har bir `npm run build` va `npm run dist:win` dan oldin `set VITE_API_URL=...` (yoki PowerShell da `$env:VITE_API_URL=...`) qiling. |
| Login "Serverga ulanib bo‘lmadi" | Backend VPS da ishlayotganini va `VITE_API_URL` da kiritilgan manzil to‘g‘ri ekanini tekshiring (brauzerda `https://nadpos.uz/api` ochilishi kerak emas, lekin backend javob qaytarishi kerak). |

---

## Ixtiyoriy: Waiter PWA ni dist ga kiritish

Agar POS installer ichida **waiter PWA** (mobil menyu) ham bo‘lishini xohlasangiz:

```bash
cd C:\Projects\nadpos\apps\pos-desktop
set VITE_API_URL=https://nadpos.uz/api
npm run dist:with-waiter
```

Bu avval waiter-pwa ni build qiladi, keyin POS desktop ni dist qiladi (waiter fayllar `mobile-dist` orqali ilovaga kiradi).
