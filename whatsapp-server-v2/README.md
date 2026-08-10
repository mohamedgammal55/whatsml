# QuickZap WhatsApp Server v2 (Baileys)

A clean, stability-hardened rewrite of the WhatsApp API server. Drop-in
compatible with the QuickZap platform (same endpoints, same webhook contract,
same `session` DB table). The old `whatsapp-server/` is untouched.

## Why this is more stable (the fixes)

| Problem (old) | Fix (v2) |
|---|---|
| Random logouts | Reconnect decided by `DisconnectReason`: **never** reconnect on `loggedOut`/`forbidden`/`badSession`; **stand down** on `connectionReplaced` (no ping-pong); exponential backoff otherwise. |
| Two processes / sockets per number → kicked | **One socket per session** (guarded map) + **single-instance** port lock + PM2 fork/instances:1. |
| Lost signal keys → invalid session | **Prisma auth state** with atomic upserts + `BufferJSON`; `saveCreds` on every `creds.update`; cacheable signal key store. |
| Slow first send (~20s) | `syncFullHistory: false`, `markOnlineOnConnect: false`, short keep-alive, no premature query timeout. |
| Crash takes everything down | Process-level `uncaughtException`/`unhandledRejection` guards keep other sessions alive. |
| After restart, all numbers need re-scan | **Auto-restore**: every linked session (`creds` row) reconnects on boot. |
| Ban signals | `markOnlineOnConnect:false`, human-like `composing` presence + jitter before sends, stable browser identity. |

> Bans are ultimately a WhatsApp **policy** matter (number reputation, opt-in,
> volume). This server minimizes technical ban signals but cannot make an
> unofficial number un-bannable — warm up numbers and pace sends.

## Setup

```bash
cd whatsapp-server-v2
cp .env.example .env        # set DATABASE_URL + BASE_URL
npm install                 # runs prisma generate
npm run prisma:pull         # OPTIONAL: introspect chat/contact/message tables for history
npm start                   # or: npm run start:pm2
```

Point the platform's `whatsapp-web.base_url` at this server's URL (same port as
the old one, e.g. `http://127.0.0.1:3000`). Run only ONE of the two servers.

## Endpoints (contract)

`GET /sessions` · `POST /sessions/add` · `GET /sessions/:id` · `DELETE /sessions/:id`
`GET /sessions/:id/qr` · `GET /sessions/:id/status`
`POST /:id/messages/send` (text + image/video/audio/voice/document/location/poll by URL)
`POST /:id/messages/download` · `POST /:id/messages/read`
`GET /:id/contacts/:jid` · `GET /:id/contacts/:jid/photo`
`GET /:id/groups/:groupId` · `GET /:id/chats` · `GET /:id/chats/:chatId` · `POST /:id/chats/:jid/read`

Webhooks are POSTed to `{BASE_URL}/api/whatsapp-web/webhook` as
`{ sessionId, event, data, ... }` for `connection.update`, `messages.upsert`,
`messages.update`, `send.message`.

## Not yet ported
- Chat/contact/message **history persistence** (endpoints return empty safely).
  Run `npm run prisma:pull` and wire the store to enable it — the send/receive
  path and stability core are complete.
