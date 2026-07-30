const express = require('express');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middlewares/errorHandler');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());

app.use(cookieParser());
app.use('/api/auth', authRoutes);

app.use(errorHandler);

module.exports = app;