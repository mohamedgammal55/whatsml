'use strict'
const path = require('path')
// Load .env from the package root explicitly, so it works no matter the CWD
// (e.g. when launched by PM2 or from another directory).
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const bool = (v, def = false) => {
  if (v === undefined || v === null || v === '') return def
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase())
}
const num = (v, def) => {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : def
}

module.exports = {
  port: num(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV || 'production',
  baseUrl: (process.env.BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, ''),
  webhookPath: '/api/whatsapp-web/webhook',
  enableWebhook: bool(process.env.ENABLE_WEBHOOK, true),
  enableWebsocket: bool(process.env.ENABLE_WEBSOCKET, true),
  logLevel: process.env.LOG_LEVEL || 'info',
  apiKey: process.env.API_KEY || '',
  // Shared secret with Laravel: signs the short-lived socket auth token so only
  // authorized users can subscribe, and only to their own sessions.
  socketSecret: process.env.SOCKET_SECRET || '',

  reconnect: {
    baseDelayMs: num(process.env.RECONNECT_BASE_DELAY_MS, 2000),
    maxDelayMs: num(process.env.RECONNECT_MAX_DELAY_MS, 60000),
    maxRetries: num(process.env.MAX_RECONNECT_RETRIES, 0) // 0 = unlimited
  },
  keepAliveIntervalMs: num(process.env.KEEPALIVE_INTERVAL_MS, 20000),
  connectTimeoutMs: num(process.env.CONNECT_TIMEOUT_MS, 30000),
  qrMaxRetries: num(process.env.QR_MAX_RETRIES, 5),

  markOnlineOnConnect: bool(process.env.MARK_ONLINE_ON_CONNECT, false),
  sendPresenceBeforeSend: bool(process.env.SEND_PRESENCE_BEFORE_SEND, true),
  syncFullHistory: bool(process.env.SYNC_FULL_HISTORY, false)
}
