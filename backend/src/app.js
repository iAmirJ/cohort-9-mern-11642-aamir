const express = require('express');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middlewares/errorHandler');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/** @type {import('express').Express} */
const app = express();

app.use(helmet());
app.use(express.json());

app.use(cookieParser());

if (process.env.NODE_ENV === 'production') {
  const isMultiProcess = process.env.NODE_APP_INSTANCE || require('cluster').isWorker;
  if (isMultiProcess) {
    throw new Error('A shared rate-limit store must be configured for multi-instance deployments.');
  }
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/auth', authLimiter, authRoutes);

app.use(errorHandler);

module.exports = app;