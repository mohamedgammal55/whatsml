'use strict'
const crypto = require('crypto')

/**
 * Tiny signed-token helper (HMAC-SHA256), shared-secret with Laravel.
 *
 * Token = base64url(payloadJSON) + "." + base64url(hmac)
 * payload = { sessions: [uuid...], exp: <unix seconds> }
 *
 * Laravel mints it for the logged-in user (scoped to that user's own session
 * UUIDs, short expiry). The socket server verifies it before letting a client
 * subscribe — so nobody can listen to sessions that aren't theirs even if they
 * know the URL.
 */
const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const b64urlDecode = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()

function sign(payload, secret) {
  const body = b64url(JSON.stringify(payload))
  const mac = b64url(crypto.createHmac('sha256', secret).update(body).digest())
  return `${body}.${mac}`
}

function verify(token, secret) {
  if (!token || typeof token !== 'string' || !secret) return null
  const [body, mac] = token.split('.')
  if (!body || !mac) return null
  const expected = b64url(crypto.createHmac('sha256', secret).update(body).digest())
  // constant-time compare
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  let payload
  try {
    payload = JSON.parse(b64urlDecode(body))
  } catch (_) {
    return null
  }
  if (payload.exp && Number(payload.exp) < Math.floor(Date.now() / 1000)) return null
  return payload
}

module.exports = { sign, verify }
