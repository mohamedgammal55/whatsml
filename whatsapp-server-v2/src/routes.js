'use strict'
const express = require('express')
const crypto = require('crypto')
const config = require('./config')
const logger = require('./logger')
const wa = require('./whatsapp')
const store = require('./store')
const { sendWebhook } = require('./webhook')

const router = express.Router()

const ok = (res, data) => res.json(data)
const fail = (res, code, message, extra = {}) =>
  res.status(code).json({ success: false, error: message, ...extra })

// Wrap async handlers so a throw becomes a clean JSON error, never a crash.
const h = (fn) => (req, res) => fn(req, res).catch((e) => {
  const code = e?.output?.statusCode || e?.statusCode || 500
  logger.warn({ path: req.path, err: e.message }, 'request failed')
  fail(res, code, e.message || 'error')
})

// Optional API-key gate.
router.use((req, res, next) => {
  if (!config.apiKey) return next()
  if (req.get('X-Api-Key') === config.apiKey) return next()
  return fail(res, 401, 'invalid api key')
})

const waitFor = async (predicate, timeoutMs = 9000, stepMs = 300) => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const v = predicate()
    if (v) return v
    await new Promise((r) => setTimeout(r, stepMs))
  }
  return predicate()
}

/* ---------------- sessions ---------------- */

router.get('/sessions', h(async (req, res) => ok(res, await wa.listSessions())))

router.post('/sessions/add', h(async (req, res) => {
  const { sessionId, authType, phoneNumber } = req.body || {}
  if (!sessionId) return fail(res, 422, 'sessionId is required')

  await wa.createSession(sessionId, { authType, phoneNumber })
  const s = wa.getSession(sessionId)

  if (authType === 'code') {
    await waitFor(() => s?.pairingCode || s?.pairingError || wa.isConnected(sessionId), 22000)
    if (s?.pairingError && !s?.pairingCode) return fail(res, 500, s.pairingError)
    return ok(res, { success: true, status: wa.statusOf(sessionId), code: s?.pairingCode || null })
  }

  await waitFor(() => s?.qr || wa.isConnected(sessionId))
  return ok(res, { success: true, status: wa.statusOf(sessionId), qr: s?.qr || null })
}))

router.get('/sessions/:id', h(async (req, res) => {
  if (!wa.sessions.has(req.params.id)) return fail(res, 404, 'session not found')
  const s = wa.getSession(req.params.id)
  return ok(res, { exists: true, status: s.status, user: s.sock?.user || null })
}))

router.delete('/sessions/:id', h(async (req, res) => ok(res, await wa.deleteSession(req.params.id))))

router.get('/sessions/:id/qr', h(async (req, res) => {
  const s = wa.getSession(req.params.id)
  return ok(res, { qr: s?.qr || null, status: wa.statusOf(req.params.id) })
}))

router.get('/sessions/:id/status', h(async (req, res) =>
  ok(res, { status: wa.statusOf(req.params.id) })
))

/* ---------------- messaging ---------------- */

// Send text OR media (image/video/audio/voice/document/location/poll).
// `message` is already a Baileys content object built by the Laravel side
// (e.g. { text }, { image: { url }, caption }, { document: { url }, ... }).
router.post('/:sessionId/messages/send', h(async (req, res) => {
  const { sessionId } = req.params
  const { jid, type = 'number', message, options = {}, generate_link_preview } = req.body || {}
  if (!jid) return fail(res, 422, 'jid is required')
  if (!message || typeof message !== 'object') return fail(res, 422, 'message is required')

  const content = { ...message }
  const sendOptions = { ...options }
  if (generate_link_preview === false) sendOptions.linkPreview = null

  const trackingId = 'msg_' + crypto.randomBytes(8).toString('hex')

  const result = await wa.sendMessage(sessionId, jid, content, { type, options: sendOptions })

  // Correlate with the Laravel app log (it reads data.tracking_id).
  sendWebhook(sessionId, 'send.message', { key: result?.key, jid, tracking_id: trackingId }, { status: 'success' })

  return ok(res, {
    success: true,
    data: {
      key: result?.key,
      message: result?.message,
      messageTimestamp: result?.messageTimestamp,
      status: 'PENDING'
    },
    tracking_id: trackingId
  })
}))

// Download media from a message object -> returns the raw file bytes.
router.post('/:sessionId/messages/download', h(async (req, res) => {
  const { buffer, mimetype } = await wa.downloadMedia(req.params.sessionId, req.body)
  res.setHeader('Content-Type', mimetype || 'application/octet-stream')
  return res.send(buffer)
}))

router.post('/:sessionId/messages/read', h(async (req, res) =>
  ok(res, await wa.markRead(req.params.sessionId, req.body?.keys || req.body))
))

/* ---------------- contacts / groups ---------------- */

router.get('/:sessionId/contacts/:jid', h(async (req, res) =>
  ok(res, await wa.checkNumber(req.params.sessionId, req.params.jid))
))

router.get('/:sessionId/contacts/:jid/photo', h(async (req, res) =>
  ok(res, await wa.profilePicture(req.params.sessionId, req.params.jid))
))

router.get('/:sessionId/groups/:groupId', h(async (req, res) =>
  ok(res, await wa.groupMetadata(req.params.sessionId, req.params.groupId))
))

/* ---------------- chats (served from the store: WhatsApp history + new) ---------------- */
router.get('/:sessionId/chats', h(async (req, res) =>
  ok(res, await store.getChats(req.params.sessionId, req.query))
))
router.get('/:sessionId/chats/:chatId', h(async (req, res) =>
  ok(res, await store.getMessages(req.params.sessionId, req.params.chatId, req.query))
))
router.post('/:sessionId/chats/:jid/read', h(async (req, res) => {
  await store.markChatRead(req.params.sessionId, req.params.jid).catch(() => {})
  try { await wa.markRead(req.params.sessionId, req.body?.keys || req.body) } catch (_) {}
  return ok(res, { success: true })
}))

module.exports = router
