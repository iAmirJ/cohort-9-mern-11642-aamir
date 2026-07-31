const express = require('express');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middlewares/errorHandler');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(helmet());
app.use(express.json());

app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/auth', authLimiter, authRoutes);

app.use(errorHandler);

module.exports = app;