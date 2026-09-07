const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

async function register(req, res, next) {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    const result = await authService.register({ email, password, displayName });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { email, code } = req.body;
    if (!email || !/^\d{6}$/.test(code || '')) {
      return res.status(400).json({ error: 'Email and a 6-digit verification code are required.' });
    }
    const result = await authService.verifyEmail({ email, code });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function me(req, res) {
  userRepository.findById(req.user.id).then((user) => res.json({ user })).catch(() => res.status(500).json({ error: 'Could not load account.' }));
}

async function updateMe(req, res, next) {
  try {
    const { displayName, preferences } = req.body;
    const user = await userRepository.updateProfile(req.user.id, {
      displayName: typeof displayName === 'string' ? displayName.trim().slice(0, 120) : undefined,
      preferences: preferences && typeof preferences === 'object' ? preferences : undefined,
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function updatePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Current password and a new password of at least 8 characters are required.' });
    }
    const user = await userRepository.findByEmail(req.user.email);
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }
    const updatedUser = await userRepository.updatePassword(req.user.id, await bcrypt.hash(newPassword, SALT_ROUNDS));
    res.json({ message: 'Password updated successfully.', user: updatedUser, token: authService.signToken(updatedUser) });
  } catch (err) {
    next(err);
  }
}

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'A profile image is required.' });
    const user = await userRepository.updateAvatar(req.user.id, `/uploads/${req.file.filename}`);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function uploadTaxDocument(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'A tax document is required.' });
    const user = await userRepository.saveTaxDocument(req.user.id, `/uploads/${req.file.filename}`);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function exportMyData(req, res, next) {
  try {
    const data = await userRepository.exportData(req.user.id);
    res.setHeader('Content-Disposition', 'attachment; filename="marketplace-data.json"');
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function deleteMe(req, res, next) {
  try {
    if (req.body.confirmation !== 'DELETE') return res.status(400).json({ error: 'Type DELETE to confirm account deletion.' });
    await userRepository.softDelete(req.user.id);
    res.json({ message: 'Account deleted.' });
  } catch (err) {
    next(err);
  }
}

async function revokeSessions(req, res, next) {
  try {
    await userRepository.revokeOtherSessions(req.user.id);
    const user = await userRepository.findById(req.user.id);
    res.json({ message: 'Other sessions signed out.', user, token: authService.signToken(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, verifyEmail, me, updateMe, updatePassword, uploadAvatar, uploadTaxDocument, exportMyData, deleteMe, revokeSessions };
