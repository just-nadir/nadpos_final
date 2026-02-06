# NadPOS — VPS ga deploy qilish (nadpos.uz)

Bu qo‘llanma **nadpos.uz** domenida barcha ilovalarni (landing, restoran admin, super-admin, backend) bitta VPS da ishga tushirish uchun.

## Nima ishlaydi

| Manzil | Ilova |
|--------|--------|
| **nadpos.uz** | Landing (asosiy sahifa), "Kirish" tugmasi |
| **nadpos.uz/login** | Restoran admin (login va hisobotlar) |
| **nadpos.uz/superadmin** | Super-admin (restoranlar va litsenziyalar) |
| **nadpos.uz/api** | Backend (NestJS) — API so‘rovlar shu yerda proxy orqali boradi |

---

## 1. VPS talablari

- Ubuntu 22.04 (yoki 20.04)
- Root yoki sudo huquqi
- Domen **nadpos.uz** server IP ga yo‘naltirilgan (A yozuv)
- Kamida 1 GB RAM, 1 CPU

---

## 2. Serverda dasturlarni o‘rnatish

SSH orqali ulaning va quyidagilarni bajaring:

```bash
# Tizimni yangilash
sudo apt update && sudo apt upgrade -y

# Node.js 20 LTS (NodeSource orqali)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 (backend uchun)
sudo npm install -g pm2

# Nginx
sudo apt install -y nginx

# Git (loyihani yuklash uchun)
sudo apt install -y git
```

---

## 3. Loyihani yuklash va sozlash

```bash
# Masalan: /var/www uchun
sudo mkdir -p /var/www
cd /var/www

# Repo klonlash (yoki rsync/scp bilan fayllarni yuboring)
git clone https://github.com/YOUR_USER/NadPOS-V2.0.0.git nadpos
cd nadpos
```

Agar Git ishlatmasangiz, loyihani ZIP yoki `rsync` bilan serverga yuboring.

---

## 4. Backend (NestJS) sozlash va ishga tushirish

```bash
cd /var/www/nadpos

# Barcha dependency larni o‘rnatish (monorepo)
npm install

# Backend .env yaratish
cd apps/backend
cp .env.example .env
nano .env
```

**.env** da production qiymatlarini kiriting:

```env
DATABASE_URL="file:./dev.db"
PORT=3000
JWT_SECRET=BU_YERGA_32_BELGIDAN_ORTIQ_Maxfiy_Kalit_Yozing
NODE_ENV=production
```

SQLite o‘rniga production da PostgreSQL ishlatmoqchi bo‘lsangiz, Prisma schema va `DATABASE_URL` ni o‘zgartiring.

```bash
# Prisma migratsiya va client
npx prisma generate
npx prisma migrate deploy

# Backend build (production)
npm run build

# (Ixtiyoriy) Super-admin foydalanuvchi yaratish
npx prisma db seed
```

PM2 bilan backend ni ishga tushiring:

```bash
cd /var/www/nadpos
pm2 start "npm run start:prod" --name nadpos-api --cwd apps/backend
pm2 save
pm2 startup
```

Backend endi `http://127.0.0.1:3000` da ishlaydi.

---

## 5. Frontend loyihalarni build qilish

Barcha build lar **loyiha root** dan (monorepo).

### 5.1 Landing (nadpos.uz asosiy sahifa)

```bash
cd /var/www/nadpos
npm run build --workspace=apps/landing-page
```

Chiqish: `apps/landing-page/dist/`

### 5.2 Restoran admin (nadpos.uz/login)

```bash
cd /var/www/nadpos
VITE_API_URL=https://nadpos.uz/api npm run build --workspace=apps/restaurant-admin
```

Chiqish: `apps/restaurant-admin/dist/`

### 5.3 Super-admin (nadpos.uz/superadmin)

```bash
cd /var/www/nadpos
VITE_API_URL=https://nadpos.uz/api npm run build --workspace=apps/super-admin
```

Chiqish: `apps/super-admin/dist/`

---

## 6. Nginx sozlash

Barcha frontend build larni bitta joyga yig‘amiz va Nginx ga ko‘rsatamiz.

```bash
sudo mkdir -p /var/www/nadpos.uz
sudo cp -r /var/www/nadpos/apps/landing-page/dist/* /var/www/nadpos.uz/

sudo mkdir -p /var/www/nadpos.uz/login
sudo cp -r /var/www/nadpos/apps/restaurant-admin/dist/* /var/www/nadpos.uz/login/

sudo mkdir -p /var/www/nadpos.uz/superadmin
sudo cp -r /var/www/nadpos/apps/super-admin/dist/* /var/www/nadpos.uz/superadmin/
```

Nginx konfiguratsiya fayli:

```bash
sudo nano /etc/nginx/sites-available/nadpos.uz
```

Quyidagini yozing (o‘rniga **nadpos.uz** domeningiz bo‘lsa, o‘zgartiring):

```nginx
server {
    listen 80;
    server_name nadpos.uz www.nadpos.uz;
    root /var/www/nadpos.uz;

    # Landing (asosiy sahifa)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Restoran admin (SPA: /login va /login/...)
    location = /login {
        return 301 /login/;
    }
    location /login/ {
        alias /var/www/nadpos.uz/login/;
        try_files $uri $uri/ /login/index.html;
    }

    # Super-admin (SPA: /superadmin va /superadmin/...)
    location = /superadmin {
        return 301 /superadmin/;
    }
    location /superadmin/ {
        alias /var/www/nadpos.uz/superadmin/;
        try_files $uri $uri/ /superadmin/index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Eslatma:** `proxy_pass http://127.0.0.1:3000/` — oxiridagi `/` tufayli so‘rovlar `/api/restaurants` → `http://127.0.0.1:3000/restaurants` ga yuboriladi.

Siteni yoqish va Nginx ni tekshirish:

```bash
sudo ln -sf /etc/nginx/sites-available/nadpos.uz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. SSL (HTTPS) — Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d nadpos.uz -d www.nadpos.uz
```

Qisqa savollarga javob bering; keyin Nginx avtomatik HTTPS ga sozlanadi. Yangilash: `sudo certbot renew --dry-run`.

---

## 8. Yangilanishlar (keyingi deploy lar)

Kod o‘zgargach:

```bash
cd /var/www/nadpos
git pull   # yoki yangi fayllarni yuboring

npm install

# Backend
pm2 restart nadpos-api

# Frontend build va nusxa
npm run build --workspace=apps/landing-page
npm run build --workspace=apps/restaurant-admin -- VITE_API_URL=https://nadpos.uz/api
npm run build --workspace=apps/super-admin -- VITE_API_URL=https://nadpos.uz/api

sudo cp -r apps/landing-page/dist/* /var/www/nadpos.uz/
sudo cp -r apps/restaurant-admin/dist/* /var/www/nadpos.uz/login/
sudo cp -r apps/super-admin/dist/* /var/www/nadpos.uz/superadmin/
```

---

## 9. Tekshirish

- **nadpos.uz** — landing ochiladi, "Kirish" → **nadpos.uz/login**
- **nadpos.uz/login** — restoran admin login (telefon + parol)
- **nadpos.uz/superadmin** — super-admin login (email + parol)
- **nadpos.uz/api** — brauzerda ochilmasa ham, frontend so‘rovlar shu yer orqali backend ga boradi

Agar 502 yoki "Connection refused" chiqsa: `pm2 status`, `pm2 logs nadpos-api` va `curl http://127.0.0.1:3000` ni tekshiring.

---

## 10. POS Desktop va Backend manzili

Restoranlar POS dasturida **Backend** sifatida `https://nadpos.uz/api` ni ko‘rsatishi kerak. POS sozlamalarida yoki `.env` da:

```env
BACKEND_URL=https://nadpos.uz/api
```

Sinxronizatsiya va login so‘rovlari shu manzilga ketadi.
