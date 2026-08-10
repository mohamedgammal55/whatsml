# QuickZap v2 — Deploy & Realtime Setup (what YOU do online)

Follow top to bottom. Two sides need env values: the **Node server** and the
**Laravel app**. The realtime socket is secured with **one shared secret** that
must be identical on both sides.

---

## 0) The shared secret (use this, or generate your own)

```
7124d784b70d976c896edba424e4eae8970074e1434e190ce0a03400678ad281
```
(generate your own with: `openssl rand -hex 32`)

Put the SAME value in BOTH env files below (`SOCKET_SECRET` on Node,
`WHATSAPP_WEB_SOCKET_SECRET` on Laravel).

---

## 1) Node server — `whatsapp-server-v2/.env`

```env
PORT=3000
NODE_ENV=production
BASE_URL=https://YOUR-APP-DOMAIN.com          # Laravel app URL (webhooks POST here)
DATABASE_URL="mysql://DBUSER:DBPASS@127.0.0.1:3306/DBNAME"   # SAME DB as the app
ENABLE_WEBHOOK=true
ENABLE_WEBSOCKET=true
LOG_LEVEL=info

# realtime auth — MUST equal Laravel's WHATSAPP_WEB_SOCKET_SECRET
SOCKET_SECRET=7124d784b70d976c896edba424e4eae8970074e1434e190ce0a03400678ad281

# stability tuning (defaults are fine)
MAX_RECONNECT_RETRIES=0
KEEPALIVE_INTERVAL_MS=20000
MARK_ONLINE_ON_CONNECT=false
SYNC_FULL_HISTORY=false
```

Run it (JS, **no build step**):
```bash
cd whatsapp-server-v2
cp .env.example .env      # then edit values above
npm install               # runs prisma generate
npm start                 # or: pm2 start ecosystem.config.js --env production
```
Run **only ONE** WhatsApp server on port 3000 (v2 OR the old one — never both).

---

## 2) Laravel app — `.env` (project root)

```env
# internal URL the app uses to call the Node server (server-to-server)
WHATSAPP_WEB_API_BASE_URL=http://127.0.0.1:3000

# PUBLIC socket URL the BROWSER connects to (see nginx step 3). Leave empty to
# keep using refresh/polling instead of realtime.
WHATSAPP_WEB_SOCKET_URL=https://wa-socket.YOUR-APP-DOMAIN.com

# same secret as the Node server's SOCKET_SECRET
WHATSAPP_WEB_SOCKET_SECRET=7124d784b70d976c896edba424e4eae8970074e1434e190ce0a03400678ad281
```
Then:
```bash
php artisan config:clear
```
And deploy the built frontend: `public/build-modules/WhatsappWeb/*` (already built).

---

## 3) Expose the Node socket publicly (nginx) — required for realtime

The browser can't reach `127.0.0.1:3000`. Give the Node server a public HTTPS
host with **WebSocket upgrade**. Easiest: a subdomain `wa-socket.YOUR-DOMAIN`.

```nginx
server {
    listen 443 ssl;
    server_name wa-socket.YOUR-APP-DOMAIN.com;

    ssl_certificate     /path/fullchain.pem;
    ssl_certificate_key /path/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;      # <-- WebSocket
        proxy_set_header Connection "upgrade";       # <-- WebSocket
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 3600s;
    }
}
```
Set `WHATSAPP_WEB_SOCKET_URL=https://wa-socket.YOUR-APP-DOMAIN.com` (step 2).
socket.io uses the default `/socket.io` path — no extra config needed.

> Security: only clients holding a valid, per-user, time-limited token (minted
> by Laravel with the shared secret) can connect, and each client only receives
> events for ITS OWN sessions. Knowing the URL is not enough.

---

## 4) Verify
1. `curl https://wa-socket.YOUR-DOMAIN.com/health` → `{"ok":true}`
2. Open a conversation → send/receive a message → it appears **without refresh**.
3. Node logs show `QuickZap WA server listening` + `restoring sessions`.

---

## Files changed (for your deploy)
**Node (new folder):** all of `whatsapp-server-v2/`
**Laravel:**
- `modules/WhatsappWeb/config/config.php` (socket_url, socket_secret)
- `modules/WhatsappWeb/app/Http/Controllers/PlatformConversationController.php` (mints socket token)
- `modules/WhatsappWeb/resources/js/Stores/chatStore.js` + `Pages/Chats/Index.vue` (socket client)
- built assets: `public/build-modules/WhatsappWeb/*`
- root `package.json` (adds `socket.io-client`)

## Summary of ALL keys you set online
| Where | Key | Value |
|---|---|---|
| Node `.env` | `DATABASE_URL` | same MySQL as the app |
| Node `.env` | `BASE_URL` | `https://YOUR-APP-DOMAIN.com` |
| Node `.env` | `SOCKET_SECRET` | the shared secret |
| Laravel `.env` | `WHATSAPP_WEB_API_BASE_URL` | `http://127.0.0.1:3000` |
| Laravel `.env` | `WHATSAPP_WEB_SOCKET_URL` | `https://wa-socket.YOUR-APP-DOMAIN.com` |
| Laravel `.env` | `WHATSAPP_WEB_SOCKET_SECRET` | the **same** shared secret |
