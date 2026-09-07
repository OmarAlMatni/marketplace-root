const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const { upload, documentUpload } = require('../config/upload');

const router = express.Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/verify-email', authLimiter, authController.verifyEmail);
router.get('/me', requireAuth, authController.me);
router.patch('/me', requireAuth, authController.updateMe);
router.patch('/me/password', requireAuth, authController.updatePassword);
router.post('/me/avatar', requireAuth, upload.single('avatar'), authController.uploadAvatar);
router.post('/me/tax-document', requireAuth, documentUpload.single('document'), authController.uploadTaxDocument);
router.get('/me/export', requireAuth, authController.exportMyData);
router.post('/me/delete', requireAuth, authController.deleteMe);
router.post('/me/sessions/revoke', requireAuth, authController.revokeSessions);

module.exports = router;
