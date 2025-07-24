const express = require('express');
const { loginWithEmail, loginWithGoogle } = require('../controllers/authController');

const router = express.Router();

router.post('/login/email', loginWithEmail);
router.post('/login', loginWithGoogle);

module.exports = router;