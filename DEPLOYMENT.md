# Project Deployment Guide

To deploy this project successfully, you need to set up two main components: the **Laravel Backend** and the **WhatsApp Node.js Server**.

## 1. Laravel Backend (PHP)

### Requirements:
- PHP 8.2+
- MySQL 8.0+
- Redis (for Queues)
- SSL Certificate (HTTPS is required for webhooks)

### Steps:
1. **Environment Config**: Copy `.env.example` to `.env` and set your production database and Pusher/Redis credentials.
2. **Install Dependencies**:
   ```bash
   composer install --optimize-autoloader --no-dev
   npm install && npm run build
   ```
3. **Optimizations**:
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```
4. **Database**:
   ```bash
   php artisan migrate --force
   ```
5. **Background Workers (CRITICAL)**:
   Auto-reply and message processing rely on queues. Run this using a process manager like **Supervisor**:
   ```bash
   php artisan queue:work --tries=3
   ```

---

## 2. WhatsApp Server (Node.js)

### Requirements:
- Node.js 18+
- MySQL (same database as Laravel)
- PM2 (Process Manager)

### Steps:
1. **Directory**: Go to the `whatsapp-server` folder.
2. **Environment Config**: Ensure `whatsapp-server/.env` has the correct `BASE_URL` (pointing to your Laravel API) and `DATABASE_URL`.
   > [!IMPORTANT]
   > `ENABLE_WEBHOOK=true` must be set in production.
3. **Install & Build**:
   ```bash
   npm install
   # If you have the src folder, run: npm run build
   # Since you are using dist directly, skip build.
   ```
4. **Run with PM2**:
   ```bash
   pm2 start dist/index.js --name "whatsapp-server"
   ```

---

## 3. Webhook Configuration

Ensure your `whatsapp-server/.env` points to your Laravel domain:
```env
BASE_URL=https://your-domain.com
```

## 4. Troubleshooting
- Check Laravel logs: `storage/logs/laravel.log`
- Check Node logs: `pm2 logs whatsapp-server`
- Ensure port `3000` (or your configured port) is open in your server firewall if needed, although it's usually used internally.
