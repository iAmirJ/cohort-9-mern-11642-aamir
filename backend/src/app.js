/** @type {import('express')} */
const express = require('express');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middlewares/errorHandler');
/** @type {import('cookie-parser')} */
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const noteRoutes = require('./routes/note.routes');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');

/** @type {import('express').Express} */
const app = express();

app.use(helmet());
app.use(express.json());

app.use(cookieParser());

app.use(pinoHttp({ logger }));

if (process.env.NODE_ENV === 'production') {
  const isMultiProcess = process.env.NODE_APP_INSTANCE || require('cluster').isWorker;
  if (isMultiProcess) {
    throw new Error('A shared rate-limit store must be configured for multi-instance deployments.');
  }
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api/auth', authLimiter, authRoutes);

const notesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
});
app.use('/api/notes', notesLimiter, noteRoutes);

app.use(errorHandler);

module.exports = app;