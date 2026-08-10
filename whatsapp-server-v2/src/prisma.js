'use strict'
const { PrismaClient } = require('@prisma/client')
const logger = require('./logger')

// One PrismaClient for the whole process (creating many exhausts DB connections).
const prisma = new PrismaClient()

async function connectPrisma() {
  await prisma.$connect()
  logger.info('Prisma connected')
}

module.exports = { prisma, connectPrisma }
