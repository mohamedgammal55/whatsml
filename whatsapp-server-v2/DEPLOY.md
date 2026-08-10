# QuickZap — نشر السيرفر الجديد (v2) + الريلتايم أونلاين

> استبدل `YOURDOMAIN.com` بدومينك، و `DBUSER/DBPASS/DBNAME` ببيانات قاعدة بياناتك.
> السرّ المشترك (SOCKET_SECRET) لازم يكون **نفسه** في لارافيل والنود.

سرّ جاهز (أو ولّد جديد: `openssl rand -hex 32`):
```
7124d784b70d976c896edba424e4eae8970074e1434e190ce0a03400678ad281
```

---

## 1) ملفات ترفعها على السيرفر
- المجلد كامل: `whatsapp-server-v2/`  (من غير `node_modules` و `.env`)
- ملفات لارافيل المعدّلة:
  - `modules/WhatsappWeb/config/config.php`
  - `modules/WhatsappWeb/app/Http/Controllers/PlatformConversationController.php`
  - `modules/WhatsappWeb/app/Http/Controllers/PlatformController.php`
  - `modules/WhatsappWeb/routes/web.php`
  - `modules/WhatsappWeb/resources/js/Stores/chatStore.js`
  - `modules/WhatsappWeb/resources/js/Pages/Chats/Index.vue`
  - `modules/WhatsappWeb/resources/js/Pages/Platforms/Index.vue`
  - `package.json` (فيه socket.io-client)

---

## 2) NODE server v2
```bash
cd whatsapp-server-v2
npm install          # JS خالص، مفيش build — بيعمل prisma generate تلقائي
cp .env.example .env
nano .env            # املأه زي تحت
```

**`whatsapp-server-v2/.env`:**
```env
PORT=3000
NODE_ENV=production

# دومين تطبيق لارافيل (النود بيبعت webhooks عليه)
BASE_URL=https://YOURDOMAIN.com

# قاعدة البيانات — نفس بتاعت المشروع
# لو الباسورد فيه رموز: node -e "console.log(encodeURIComponent('PASS'))"
DATABASE_URL="mysql://DBUSER:DBPASS@127.0.0.1:3306/DBNAME"

ENABLE_WEBHOOK=true
ENABLE_WEBSOCKET=true
LOG_LEVEL=info

# نفس السرّ اللي في لارافيل
SOCKET_SECRET=7124d784b70d976c896edba424e4eae8970074e1434e190ce0a03400678ad281

RECONNECT_INTERVAL=15000
MAX_RECONNECT_RETRIES=0
KEEPALIVE_INTERVAL_MS=20000
CONNECT_TIMEOUT_MS=30000
MARK_ONLINE_ON_CONNECT=false
SEND_PRESENCE_BEFORE_SEND=true
SYNC_FULL_HISTORY=false
API_KEY=
```

شغّله (وأوقف القديم الأول — سيرفر واحد بس على 3000):
```bash
pm2 stop <old-app-name>          # لو القديم شغّال بـ pm2
npm run start:pm2                # pm2 start ecosystem.config.js --env production
pm2 save
```

---

## 3) LARAVEL .env (على السيرفر) — أضف/عدّل
```env
WHATSAPP_WEB_API_BASE_URL=http://127.0.0.1:3000
WHATSAPP_WEB_SOCKET_URL=https://wa-socket.YOURDOMAIN.com
WHATSAPP_WEB_SOCKET_SECRET=7124d784b70d976c896edba424e4eae8970074e1434e190ce0a03400678ad281
```
```bash
php artisan config:clear
```

---

## 4) بناء الفرونت (فيه socket.io-client + تعديلات الشات)
```bash
# جذر المشروع
npm install
npm run build
```

---

## 5) nginx — subdomain للسوكت (WebSocket)
subdomain `wa-socket.YOURDOMAIN.com` يوجّه للنود 3000 مع WebSocket:
```nginx
server {
    listen 80;
    server_name wa-socket.YOURDOMAIN.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }
}
```
فعّل HTTPS (لازم wss):
```bash
sudo certbot --nginx -d wa-socket.YOURDOMAIN.com
sudo nginx -t && sudo systemctl reload nginx
```
> aaPanel/CyberPanel: اعمل subdomain، proxy للـ 3000 مع تفعيل WebSocket + SSL من اللوحة.

---

## 6) تأكيد
- `pm2 logs quickzap-wa-v2` → `listening` + `restoring sessions` + `connection open`.
- افتح صفحة المحادثات → الكونسول: `WA socket connected` بدون أخطاء.
- ابعت/استقبل → الرسالة تظهر لحظياً.

## رجوع سريع
```bash
pm2 stop quickzap-wa-v2 && pm2 start <old-app-name>
```
(الاتنين على نفس القاعدة، فالجلسات المربوطة زي ما هي.)

---

### ملخص المفاتيح
| | لارافيل `.env` | النود `.env` |
|---|---|---|
| قاعدة البيانات | `DB_*` (موجودة) | `DATABASE_URL` (نفسها) |
| رابط النود الداخلي | `WHATSAPP_WEB_API_BASE_URL=http://127.0.0.1:3000` | `PORT=3000` |
| هدف الـ webhook | — | `BASE_URL=https://YOURDOMAIN.com` |
| رابط السوكت العام | `WHATSAPP_WEB_SOCKET_URL=https://wa-socket.YOURDOMAIN.com` | (عبر nginx) |
| السرّ المشترك | `WHATSAPP_WEB_SOCKET_SECRET=...` | `SOCKET_SECRET=...` (نفسه) |
