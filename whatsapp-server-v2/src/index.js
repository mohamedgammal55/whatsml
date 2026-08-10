'use strict'

// Bigger libuv pool for Baileys crypto + DB I/O under load (set before use).
if (!process.env.UV_THREADPOOL_SIZE) process.env.UV_THREADPOOL_SIZE = '32'
require('events').EventEmitter.defaultMaxListeners = 100

const http = require('http')
const express = require('express')
const cors = require('cors')
const { Server } = require('socket.io')

const config = require('./config')
const logger = require('./logger')
const { prisma, connectPrisma } = require('./prisma')
const wa = require('./whatsapp')
const routes = require('./routes')

// --- process-level safety: one session's error must never kill the process ---
process.on('unhandledRejection', (reason) =>
  logger.error({ err: reason instanceof Error ? reason.message : String(reason) }, 'unhandledRejection (kept alive)')
)
process.on('uncaughtException', (err) => {
  if (['EADDRINUSE', 'EACCES'].includes(err.code)) {
    logger.fatal({ code: err.code }, 'fatal — exiting for supervisor restart')
    process.exit(1)
  }
  logger.error({ err: err.message, stack: err.stack }, 'uncaughtException (kept alive)')
})

const app = express()
app.use(cors())
app.use(express.json({ limit: '15mb' }))
app.use(express.urlencoded({ extended: true, limit: '15mb' }))

app.get('/', (req, res) => res.json({ name: 'quickzap-wa-server', status: 'ok' }))
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }))
app.use('/', routes)

const server = http.createServer(app)

if (config.enableWebsocket) {
  const token = require('./token')
  const io = new Server(server, { cors: { origin: '*' } })

  // Authorize every socket. With a shared secret (production), a valid signed
  // token is REQUIRED and the socket may only join its own session rooms — so
  // nobody can listen to sessions that aren't theirs even with the URL.
  io.use((socket, next) => {
    if (!config.socketSecret) {
      socket.data.sessions = null // dev mode: no secret -> allow any subscribe
      return next()
    }
    const t = socket.handshake.auth?.token || socket.handshake.query?.token
    const payload = token.verify(t, config.socketSecret)
    if (!payload) return next(new Error('unauthorized'))
    socket.data.sessions = Array.isArray(payload.sessions) ? payload.sessions : []
    next()
  })

  io.on('connection', (socket) => {
    const allowed = socket.data.sessions
    const canJoin = (sid) => allowed === null || allowed.includes(sid)
    if (Array.isArray(allowed)) for (const sid of allowed) socket.join('session:' + sid)
    socket.on('subscribe', (sid) => { if (sid && canJoin(sid)) socket.join('session:' + sid) })
    socket.on('unsubscribe', (sid) => socket.leave('session:' + sid))
  })

  wa.setIo(io)
  logger.info('socket.io enabled')
}

// Restore every already-linked session after a restart so numbers reconnect
// automatically (no manual re-scan needed).
async function restoreSessions() {
  try {
    const rows = await prisma.session.findMany({
      where: { id: 'creds' },
      select: { sessionId: true }
    })
    logger.info({ count: rows.length }, 'restoring sessions')
    for (const row of rows) {
      wa.createSession(row.sessionId).catch((e) =>
        logger.warn({ sessionId: row.sessionId, err: e.message }, 'restore failed')
      )
      await new Promise((r) => setTimeout(r, 800)) // stagger to avoid a thundering herd
    }
  } catch (e) {
    logger.error({ err: e.message }, 'restoreSessions failed')
  }
}

// Single-instance guard: refuse to start a second process on the same port
// (running two processes for one session is the classic logout cause).
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.fatal({ port: config.port }, 'port in use — another instance is running. Exiting.')
    process.exit(1)
  }
  throw err
})

server.listen(config.port, async () => {
  logger.info({ port: config.port, env: config.nodeEnv }, 'QuickZap WA server listening')
  await connectPrisma()
  await restoreSessions()
})

// --- graceful shutdown ---
let shuttingDown = false
const shutdown = async (signal) => {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'shutting down gracefully')
  try {
    for (const s of wa.sessions.values()) {
      try {
        s.sock?.ev?.removeAllListeners()
        s.sock?.ws?.close()
      } catch (_) {}
    }
    await prisma.$disconnect().catch(() => {})
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 4000)
  } catch (_) {
    process.exit(0)
  }
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
