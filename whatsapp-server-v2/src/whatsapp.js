'use strict'
const baileys = require('baileys')
const makeWASocket = baileys.makeWASocket || baileys.default
const {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  downloadMediaMessage,
  Browsers,
  delay
} = baileys
const { Boom } = require('@hapi/boom')
const QRCode = require('qrcode')
const NodeCache = require('node-cache')

const config = require('./config')
const logger = require('./logger')
const { usePrismaAuthState } = require('./auth-state')
const { sendWebhook } = require('./webhook')
const store = require('./store')

// Baileys is chatty; keep it at warn unless debugging.
const waLogger = logger.child({ mod: 'baileys' })
waLogger.level = config.logLevel === 'debug' ? 'debug' : 'warn'

/** sessionId -> session runtime */
const sessions = new Map()
let io = null
const setIo = (server) => (io = server)
// Emit ONLY to the session's private room so a client receives events for its
// own sessions only (authorized in index.js).
const emit = (sessionId, event, data = {}) => {
  if (io && config.enableWebsocket) {
    io.to('session:' + sessionId).emit(event, { sessionId, ...(data || {}) })
  }
}

const jidOf = (raw, type = 'number') => {
  if (!raw) return raw
  if (String(raw).includes('@')) return raw
  const digits = String(raw).replace(/[^0-9]/g, '')
  return type === 'group' ? `${digits}@g.us` : `${digits}@s.whatsapp.net`
}

function getSession(sessionId) {
  return sessions.get(sessionId)
}
function isConnected(sessionId) {
  const s = sessions.get(sessionId)
  return !!(s && s.status === 'connected' && s.sock)
}
function statusOf(sessionId) {
  const s = sessions.get(sessionId)
  return s ? s.status : 'inactive'
}

async function setStatus(sessionId, status) {
  const s = sessions.get(sessionId)
  if (s) s.status = status
  emit(sessionId, 'status', { status })
  await sendWebhook(sessionId, 'connection.update', { status })
}

/**
 * Create (or reuse) exactly ONE socket per session.
 * Concurrent/duplicate sockets for the same number are THE classic logout
 * cause, so we guard hard against it.
 */
async function createSession(sessionId, opts = {}) {
  const existing = sessions.get(sessionId)
  if (existing) {
    if (existing.connecting) return existing
    if (existing.sock && existing.status === 'connected') return existing
    // stale slot — tear the old socket down before recreating
    try {
      existing.sock?.ev?.removeAllListeners()
      existing.sock?.ws?.close()
    } catch (_) {}
  }

  const auth = await usePrismaAuthState(sessionId)
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }))
  const msgRetryCounterCache = (existing && existing.msgRetryCounterCache) || new NodeCache()

  const session = {
    sessionId,
    sock: null,
    auth,
    status: 'connecting',
    qr: null,
    qrRetries: 0,
    retries: 0,
    connecting: true,
    reconnectTimer: null,
    msgRetryCounterCache,
    authType: opts.authType || 'qr',
    phoneNumber: opts.phoneNumber || null
  }
  sessions.set(sessionId, session)

  const sock = makeWASocket({
    version,
    logger: waLogger,
    auth: {
      creds: auth.state.creds,
      keys: makeCacheableSignalKeyStore(auth.state.keys, waLogger)
    },
    // Matches the Baileys default (and the old server), proven to work for both
    // QR and pairing code. The earlier "couldn't find device" was caused by
    // using "Desktop" (not a real browser name) — NOT by the macOS platform.
    browser: Browsers.macOS('Chrome'),
    markOnlineOnConnect: config.markOnlineOnConnect,
    syncFullHistory: config.syncFullHistory,
    connectTimeoutMs: config.connectTimeoutMs,
    keepAliveIntervalMs: config.keepAliveIntervalMs,
    defaultQueryTimeoutMs: undefined,
    retryRequestDelayMs: 500,
    maxMsgRetryCount: 5,
    qrTimeout: 60000,
    emitOwnEvents: true,
    generateHighQualityLinkPreview: false,
    // Ignore Status/broadcast traffic — a business server doesn't need contacts'
    // status updates, and skipping them removes the harmless but noisy
    // "No session found to decrypt" errors and saves processing.
    shouldIgnoreJid: (jid) => typeof jid === 'string' && jid.endsWith('@broadcast'),
    msgRetryCounterCache,
    // We don't keep a full message store; returning undefined lets Baileys
    // fall back to its retry system without throwing.
    getMessage: async () => undefined
  })

  session.sock = sock

  // --- persist creds on every update (critical) ---
  sock.ev.on('creds.update', auth.saveCreds)

  // --- pairing code path (login without QR) ---
  if (session.authType === 'code' && session.phoneNumber && !sock.authState.creds.registered) {
    requestPairing(session).catch((e) =>
      logger.warn({ sessionId, err: e.message }, 'pairing code request failed')
    )
  }

  // --- connection lifecycle ---
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      session.qrRetries += 1
      if (session.qrRetries > config.qrMaxRetries) {
        logger.info({ sessionId }, 'QR retries exhausted, closing socket')
        try { sock.ws.close() } catch (_) {}
        session.qr = null
        await setStatus(sessionId, 'disconnected')
        return
      }
      try {
        session.qr = await QRCode.toDataURL(qr)
        emit(sessionId, 'qr', { qr: session.qr })
      } catch (_) {}
    }

    if (connection === 'connecting') {
      session.status = 'connecting'
    }

    if (connection === 'open') {
      session.connecting = false
      session.retries = 0
      session.qr = null
      session.qrRetries = 0
      logger.info({ sessionId }, 'connection open')
      await setStatus(sessionId, 'connected')
    }

    if (connection === 'close') {
      session.connecting = false
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode
      handleClose(sessionId, code)
    }
  })

  // --- initial history WhatsApp pushes on link/connect -> store it ---
  sock.ev.on('messaging-history.set', async ({ chats, contacts, messages }) => {
    try {
      if (chats?.length) await store.upsertChats(sessionId, chats)
      if (contacts?.length) await store.upsertContacts(sessionId, contacts)
      if (messages?.length) await store.saveMessages(sessionId, messages)
      logger.info({ sessionId, chats: chats?.length || 0, messages: messages?.length || 0 }, 'history synced')
    } catch (e) {
      logger.debug({ sessionId, err: e.message }, 'history set failed')
    }
  })

  // --- incoming messages -> store + realtime + webhook ---
  sock.ev.on('messages.upsert', async (payload) => {
    try { if (payload?.messages?.length) await store.saveMessages(sessionId, payload.messages) } catch (_) {}
    emit(sessionId, 'messages.upsert', { messages: payload?.messages || [], type: payload?.type })
    await sendWebhook(sessionId, 'messages.upsert', payload)
  })
  // --- delivery/read status updates -> realtime + webhook ---
  sock.ev.on('messages.update', async (payload) => {
    emit(sessionId, 'messages.update', { updates: payload })
    await sendWebhook(sessionId, 'messages.update', payload)
  })

  // --- chat metadata -> store ---
  // chats.upsert fires a BURST during history sync -> store only (no emit),
  // otherwise it floods/crashes the UI. chats.update is live (few) -> emit.
  sock.ev.on('chats.upsert', (chats) => store.upsertChats(sessionId, chats).catch(() => {}))
  sock.ev.on('chats.update', (chats) => {
    store.upsertChats(sessionId, chats).catch(() => {})
    emit(sessionId, 'chats.update', { chats })
  })
  sock.ev.on('contacts.upsert', (contacts) => store.upsertContacts(sessionId, contacts).catch(() => {}))
  sock.ev.on('contacts.update', (contacts) => store.upsertContacts(sessionId, contacts).catch(() => {}))

  return session
}

// Request a pairing code (login without QR). Baileys needs the socket to have
// started its handshake first, so we wait, then retry a few times, and capture
// the real error so the API can report it instead of a silent null.
async function requestPairing(session) {
  session.pairingError = null
  const number = String(session.phoneNumber || '').replace(/[^0-9]/g, '')
  if (!number) {
    session.pairingError = 'invalid phone number (must include country code, digits only)'
    return
  }
  await delay(3000)
  let lastErr
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (!session.sock || session.sock.authState.creds.registered) return
      const code = await session.sock.requestPairingCode(number)
      session.pairingCode = code
      session.pairingError = null
      emit(session.sessionId, 'code', { code })
      logger.info({ sessionId: session.sessionId }, 'pairing code issued')
      return
    } catch (e) {
      lastErr = e
      await delay(2000)
    }
  }
  session.pairingError = (lastErr && lastErr.message) || 'failed to get pairing code'
  logger.warn({ sessionId: session.sessionId, err: session.pairingError }, 'pairing code failed')
}

function handleClose(sessionId, code) {
  const s = sessions.get(sessionId)
  if (!s) return
  const DR = DisconnectReason

  // Session is permanently invalid — do NOT reconnect (would spin forever).
  const fatal = [DR.loggedOut, DR.forbidden, DR.badSession, DR.multideviceMismatch]
  // Another socket took over this session. Reconnecting here would fight it and
  // ping-pong both connections into logout. Stand down (single-socket rule).
  const replaced = code === DR.connectionReplaced

  if (fatal.includes(code) || replaced) {
    logger.warn({ sessionId, code }, replaced ? 'connection replaced — standing down' : 'fatal disconnect — clearing session')
    if (fatal.includes(code) && code === DR.loggedOut) {
      s.auth?.clear?.().catch(() => {})
    }
    try { s.sock?.ev?.removeAllListeners() } catch (_) {}
    setStatus(sessionId, 'disconnected')
    if (fatal.includes(code)) sessions.delete(sessionId)
    return
  }

  // restartRequired (515) happens right after pairing — reconnect immediately.
  const immediate = code === DR.restartRequired
  const { baseDelayMs, maxDelayMs, maxRetries } = config.reconnect
  s.retries += 1
  if (maxRetries > 0 && s.retries > maxRetries) {
    logger.warn({ sessionId, retries: s.retries }, 'max reconnect retries reached')
    setStatus(sessionId, 'disconnected')
    return
  }
  const wait = immediate ? 0 : Math.min(baseDelayMs * 2 ** (s.retries - 1), maxDelayMs)
  logger.info({ sessionId, code, retries: s.retries, wait }, 'scheduling reconnect')
  setStatus(sessionId, 'connecting')
  if (s.reconnectTimer) clearTimeout(s.reconnectTimer)
  s.reconnectTimer = setTimeout(() => {
    createSession(sessionId, { authType: s.authType, phoneNumber: s.phoneNumber }).catch((e) =>
      logger.error({ sessionId, err: e.message }, 'reconnect failed')
    )
  }, wait)
}

async function deleteSession(sessionId, { logout = true } = {}) {
  const s = sessions.get(sessionId)
  if (s) {
    if (s.reconnectTimer) clearTimeout(s.reconnectTimer)
    try {
      if (logout && s.sock && s.status === 'connected') await s.sock.logout().catch(() => {})
      s.sock?.ev?.removeAllListeners()
      s.sock?.ws?.close()
    } catch (_) {}
    await s.auth?.clear?.().catch(() => {})
    sessions.delete(sessionId)
  } else {
    // no live socket, still clear any persisted creds
    const auth = await usePrismaAuthState(sessionId)
    await auth.clear().catch(() => {})
  }
  emit(sessionId, 'status', { status: 'inactive' })
  return { success: true }
}

async function ensureReady(sessionId) {
  if (isConnected(sessionId)) return sessions.get(sessionId)
  throw new Boom('Session is not connected', { statusCode: 409 })
}

async function sendMessage(sessionId, rawJid, content, { type = 'number', options = {} } = {}) {
  const s = await ensureReady(sessionId)
  const jid = jidOf(rawJid, type)

  if (config.sendPresenceBeforeSend) {
    try {
      await s.sock.presenceSubscribe(jid)
      await s.sock.sendPresenceUpdate('composing', jid)
      await delay(400 + Math.floor(Math.random() * 900))
    } catch (_) {}
  }

  const result = await s.sock.sendMessage(jid, content, options)

  if (config.sendPresenceBeforeSend) {
    try { await s.sock.sendPresenceUpdate('paused', jid) } catch (_) {}
  }

  return result
}

async function profilePicture(sessionId, rawJid, type = 'preview') {
  const s = await ensureReady(sessionId)
  const jid = jidOf(rawJid, 'number')
  try {
    const url = await s.sock.profilePictureUrl(jid, type)
    return { url }
  } catch (_) {
    return { url: null }
  }
}

async function markRead(sessionId, keys) {
  const s = await ensureReady(sessionId)
  if (Array.isArray(keys) && keys.length) await s.sock.readMessages(keys)
  return { success: true }
}

async function groupMetadata(sessionId, groupId) {
  const s = await ensureReady(sessionId)
  return s.sock.groupMetadata(jidOf(groupId, 'group'))
}

async function checkNumber(sessionId, rawNumber) {
  const s = await ensureReady(sessionId)
  const jid = jidOf(rawNumber, 'number')
  const res = await s.sock.onWhatsApp(jid)
  const hit = Array.isArray(res) ? res[0] : null
  return { exists: !!hit?.exists, jid: hit?.jid || jid }
}

function extractMime(message) {
  const m = message?.message || {}
  const node =
    m.imageMessage || m.videoMessage || m.audioMessage || m.documentMessage ||
    m.stickerMessage || m.documentWithCaptionMessage?.message?.documentMessage
  return node?.mimetype || 'application/octet-stream'
}

async function downloadMedia(sessionId, message) {
  const s = await ensureReady(sessionId)
  const buffer = await downloadMediaMessage(
    message,
    'buffer',
    {},
    { logger: waLogger, reuploadRequest: s.sock.updateMediaMessage }
  )
  return { buffer, mimetype: extractMime(message) }
}

async function listSessions() {
  return Array.from(sessions.values()).map((s) => ({
    sessionId: s.sessionId,
    status: s.status,
    user: s.sock?.user || null
  }))
}

module.exports = {
  setIo,
  createSession,
  deleteSession,
  getSession,
  isConnected,
  statusOf,
  sendMessage,
  checkNumber,
  downloadMedia,
  profilePicture,
  markRead,
  groupMetadata,
  listSessions,
  setStatus,
  jidOf,
  sessions
}
