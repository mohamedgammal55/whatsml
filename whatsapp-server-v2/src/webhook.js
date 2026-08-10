'use strict'
const axios = require('axios')
const config = require('./config')
const logger = require('./logger')

// Dedicated axios instance with a sane timeout so a slow/unreachable Laravel
// never blocks the WhatsApp event loop.
const client = axios.create({
  baseURL: config.baseUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
})

/**
 * POST an event to the Laravel webhook.
 * Contract: { sessionId, event: '<dot.name>', data, ...extra }
 * Laravel resolves the platform by `sessionId` (= platform.uuid) and dispatches
 * `event` (dot-name → camelCase handler).
 *
 * Fire-and-forget with light retry. Never throws into the caller — a webhook
 * failure must NEVER crash a session.
 */
async function sendWebhook(sessionId, event, data = {}, extra = {}) {
  if (!config.enableWebhook) return
  const payload = { sessionId, event, data, ...extra }
  const attempt = async (n) => {
    try {
      await client.post(config.webhookPath, payload)
    } catch (e) {
      const status = e.response ? e.response.status : e.code
      if (n < 2) {
        setTimeout(() => attempt(n + 1), 1500 * (n + 1))
      } else {
        logger.warn({ sessionId, event, status }, 'webhook delivery failed')
      }
    }
  }
  attempt(0)
}

module.exports = { sendWebhook }
