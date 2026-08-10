'use strict'
const { prisma } = require('./prisma')
const logger = require('./logger')

/**
 * Chat/message store.
 *
 * Baileys has no "fetch chats from WhatsApp on demand" (that's whatsapp-web.js,
 * which runs a full browser). Instead WhatsApp PUSHES history via
 * `messaging-history.set` and new items via `messages.upsert`. We persist those
 * events into the shared `chat`/`contact`/`message` tables and serve them here —
 * so the data genuinely comes from WhatsApp, and older data already written by
 * the previous server shows up too.
 */

// BigInt (and nested) -> JSON-safe.
const jsonSafe = (v) => {
  if (typeof v === 'bigint') return Number(v)
  if (Array.isArray(v)) return v.map(jsonSafe)
  if (v && typeof v === 'object') {
    const o = {}
    for (const k in v) o[k] = jsonSafe(v[k])
    return o
  }
  return v
}

const num = (v) => (v === null || v === undefined ? 0 : Number(v))

/* ---------------- reads ---------------- */

async function getChats(sessionId, { limit = 20, cursor } = {}) {
  const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100)
  const rows = await prisma.chat.findMany({
    where: { sessionId },
    orderBy: [{ conversationTimestamp: 'desc' }, { pkId: 'desc' }],
    take,
    ...(cursor ? { cursor: { pkId: parseInt(cursor, 10) }, skip: 1 } : {}),
    select: {
      pkId: true, id: true, name: true, displayName: true,
      unreadCount: true, picture: true, conversationTimestamp: true, archived: true,
      pnJid: true, lidJid: true
    }
  })
  // resolve names from the contact table for the chats on this page
  const ids = rows.map((r) => r.id)
  const contacts = ids.length
    ? await prisma.contact.findMany({
        where: { sessionId, id: { in: ids } },
        select: { id: true, name: true, notify: true, verifiedName: true, imgUrl: true }
      })
    : []
  const cmap = {}
  for (const c of contacts) cmap[c.id] = c

  const numberOf = (jid) => String(jid || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '')
  // only accept a real absolute image URL; stale/relative values (from older
  // data) resolve to broken relative requests in the browser.
  const validPic = (u) => (typeof u === 'string' && /^https?:\/\//i.test(u) ? u : null)

  const data = rows.map((r) => {
    const c = cmap[r.id] || {}
    // For LID-addressed chats the real phone lives in pnJid; prefer it.
    const number = numberOf(r.pnJid || (r.id.endsWith('@lid') ? r.lidJid : r.id) || r.id)
    return {
      id: r.id,
      sessionId,
      name: r.name || r.displayName || c.name || c.notify || c.verifiedName || number || r.id,
      number,
      unreadCount: r.unreadCount || 0,
      picture: validPic(r.picture) || validPic(c.imgUrl) || null,
      conversationTimestamp: num(r.conversationTimestamp),
      archived: !!r.archived
    }
  })
  const nextCursor = rows.length === take ? rows[rows.length - 1].pkId : null
  return { data, cursor: nextCursor }
}

async function getMessages(sessionId, remoteJid, { limit = 25, cursor } = {}) {
  const take = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100)
  // A contact can be addressed by both a @lid and a phone jid. Merge messages
  // stored under either so opening the chat always shows the full thread.
  const chat = await prisma.chat
    .findUnique({ where: { sessionId_id: { sessionId, id: remoteJid } }, select: { pnJid: true, lidJid: true } })
    .catch(() => null)
  const jids = [...new Set([remoteJid, chat?.pnJid, chat?.lidJid].filter(Boolean))]
  const rows = await prisma.message.findMany({
    where: { sessionId, remoteJid: { in: jids } },
    orderBy: [{ messageTimestamp: 'desc' }, { pkId: 'desc' }],
    take,
    ...(cursor ? { cursor: { pkId: parseInt(cursor, 10) }, skip: 1 } : {}),
    select: {
      pkId: true, key: true, message: true, messageTimestamp: true,
      status: true, pushName: true, participant: true, reactions: true, starred: true
    }
  })
  const data = rows.map((r) => jsonSafe({
    key: r.key,
    id: r.key?.id,
    sessionId,
    message: r.message,
    messageTimestamp: r.messageTimestamp,
    status: r.status,
    pushName: r.pushName,
    participant: r.participant,
    reactions: r.reactions,
    starred: r.starred
  }))
  const nextCursor = rows.length === take ? rows[rows.length - 1].pkId : null
  return { data, cursor: nextCursor }
}

/* ---------------- writes ---------------- */

async function saveMessages(sessionId, messages = []) {
  for (const m of messages) {
    try {
      const remoteJid = m.key?.remoteJid
      const id = m.key?.id
      if (!remoteJid || !id) continue
      const record = {
        key: m.key || {},
        message: m.message || undefined,
        messageTimestamp: m.messageTimestamp ? BigInt(Math.floor(Number(m.messageTimestamp))) : null,
        pushName: m.pushName || null,
        status: typeof m.status === 'number' ? m.status : null,
        participant: m.participant || m.key?.participant || null
      }
      await prisma.message.upsert({
        where: { sessionId_remoteJid_id: { sessionId, remoteJid, id } },
        update: record,
        create: { sessionId, remoteJid, id, ...record }
      })
      // bump the chat's last-activity + unread for incoming
      await bumpChat(sessionId, remoteJid, m)
    } catch (e) {
      logger.debug({ sessionId, err: e.message }, 'saveMessage failed')
    }
  }
}

async function bumpChat(sessionId, jid, m) {
  const ts = m.messageTimestamp ? BigInt(Math.floor(Number(m.messageTimestamp))) : null
  const incoming = !m.key?.fromMe
  // For LID chats the real phone number rides on remoteJidAlt.
  const altJid = m.key?.remoteJidAlt && String(m.key.remoteJidAlt).endsWith('@s.whatsapp.net') ? m.key.remoteJidAlt : null
  const name = incoming && m.pushName ? m.pushName : null
  try {
    const existing = await prisma.chat.findUnique({ where: { sessionId_id: { sessionId, id: jid } }, select: { pkId: true, name: true, pnJid: true } })
    if (existing) {
      await prisma.chat.update({
        where: { sessionId_id: { sessionId, id: jid } },
        data: {
          conversationTimestamp: ts ?? undefined,
          unreadCount: incoming ? { increment: 1 } : undefined,
          pnJid: existing.pnJid || altJid || undefined,
          name: existing.name || name || undefined
        }
      })
    } else {
      await prisma.chat.create({
        data: {
          sessionId, id: jid,
          name: name || null,
          pnJid: altJid,
          conversationTimestamp: ts,
          unreadCount: incoming ? 1 : 0
        }
      })
    }
  } catch (e) {
    logger.debug({ sessionId, err: e.message }, 'bumpChat failed')
  }
}

async function upsertChats(sessionId, chats = []) {
  for (const c of chats) {
    try {
      if (!c.id) continue
      const data = {
        name: c.name ?? undefined,
        displayName: c.displayName ?? undefined,
        conversationTimestamp: c.conversationTimestamp ? BigInt(Math.floor(Number(c.conversationTimestamp))) : undefined,
        unreadCount: typeof c.unreadCount === 'number' ? c.unreadCount : undefined,
        archived: typeof c.archived === 'boolean' ? c.archived : undefined,
        lidJid: c.lidJid ?? undefined,
        pnJid: c.pnJid ?? undefined
      }
      await prisma.chat.upsert({
        where: { sessionId_id: { sessionId, id: c.id } },
        update: data,
        create: { sessionId, id: c.id, ...data }
      })
    } catch (e) {
      logger.debug({ sessionId, err: e.message }, 'upsertChat failed')
    }
  }
}

async function markChatRead(sessionId, jid) {
  try {
    await prisma.chat.update({
      where: { sessionId_id: { sessionId, id: jid } },
      data: { unreadCount: 0 }
    })
  } catch (_) {}
}

async function upsertContacts(sessionId, contacts = []) {
  for (const c of contacts) {
    try {
      if (!c.id) continue
      const data = {
        name: c.name ?? undefined,
        notify: c.notify ?? undefined,
        verifiedName: c.verifiedName ?? undefined,
        imgUrl: typeof c.imgUrl === 'string' ? c.imgUrl : undefined,
        status: c.status ?? undefined
      }
      await prisma.contact.upsert({
        where: { sessionId_id: { sessionId, id: c.id } },
        update: data,
        create: { sessionId, id: c.id, ...data }
      })
    } catch (e) {
      logger.debug({ sessionId, err: e.message }, 'upsertContact failed')
    }
  }
}

module.exports = {
  getChats,
  getMessages,
  saveMessages,
  upsertChats,
  upsertContacts,
  markChatRead
}
