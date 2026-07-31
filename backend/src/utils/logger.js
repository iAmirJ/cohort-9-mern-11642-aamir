// @ts-check
const pino = require('pino');

/** @type {import('pino').Logger} */
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

module.exports = logger; 