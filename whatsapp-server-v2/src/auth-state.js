'use strict'
const { initAuthCreds, BufferJSON, proto } = require('baileys')
const { prisma } = require('./prisma')
const logger = require('./logger')

/**
 * Prisma-backed Baileys auth state.
 *
 * WHY THIS MATTERS FOR STABILITY:
 * The #1 cause of "keeps logging out" is losing/racing the signal keys. Baileys
 * persists identity via `creds` and per-message signal keys via `keys.set`. If
 * those writes are dropped, duplicated across processes, or serialized wrong,
 * WhatsApp treats the session as invalid → logout. Here every write is an
 * atomic upsert into the shared `session` table, serialized with Baileys'
 * BufferJSON so Buffers survive a JSON round-trip intact.
 */
async function usePrismaAuthState(sessionId) {
  const key = (id) => ({ sessionId_id: { sessionId, id } })

  const write = async (id, value) => {
    const data = JSON.stringify(value, BufferJSON.replacer)
    await prisma.session.upsert({
      where: key(id),
      update: { data },
      create: { sessionId, id, data }
    })
  }

  const read = async (id) => {
    try {
      const row = await prisma.session.findUnique({ where: key(id) })
      if (!row) return null
      return JSON.parse(row.data, BufferJSON.reviver)
    } catch (e) {
      logger.warn({ sessionId, id, err: e.message }, 'auth read failed')
      return null
    }
  }

  const remove = async (id) => {
    await prisma.session.deleteMany({ where: { sessionId, id } }).catch(() => {})
  }

  const creds = (await read('creds')) || initAuthCreds()

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const result = {}
          await Promise.all(
            ids.map(async (id) => {
              let value = await read(`${type}-${id}`)
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value)
              }
              result[id] = value
            })
          )
          return result
        },
        set: async (data) => {
          const tasks = []
          for (const type in data) {
            for (const id in data[type]) {
              const value = data[type][id]
              const sid = `${type}-${id}`
              tasks.push(value ? write(sid, value) : remove(sid))
            }
          }
          await Promise.all(tasks)
        }
      }
    },
    // Debounced-safe: called on every creds.update; a single atomic write.
    saveCreds: () => write('creds', creds),
    // Full wipe for this session (logout / reset).
    clear: async () => {
      await prisma.session.deleteMany({ where: { sessionId } }).catch(() => {})
    }
  }
}

module.exports = { usePrismaAuthState }
