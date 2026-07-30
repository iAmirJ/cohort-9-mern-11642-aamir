const express = require('express');
const { register, login, logout } = require('../controllers/auth.controller');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth.middleware');
const { refresh, getMe } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', registerValidator, validate, register);

router.post('/login', loginValidator, validate, login);

router.post('/logout', logout);

router.post('/refresh', refresh);

router.get('/me', authenticate, getMe);

module.exports = router;