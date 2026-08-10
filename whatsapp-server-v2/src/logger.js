'use strict'
const pino = require('pino')
const config = require('./config')

// Single shared logger. Baileys gets a child of this so its noise is namespaced
// and controllable via LOG_LEVEL.
const logger = pino({
  level: config.logLevel,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime
})

module.exports = logger
