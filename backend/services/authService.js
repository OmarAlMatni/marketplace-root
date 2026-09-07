const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { sendVerificationEmail } = require('../config/email');

const SALT_ROUNDS = 12;

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, sessionVersion: user.session_version },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function createVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function issueVerificationCode(user) {
  const code = createVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await userRepository.saveVerificationCode(user.id, code, expiresAt);
  await sendVerificationEmail({ email: user.email, code });
}

/**
 * Public self-registration. Always creates a plain 'user' — admin and
 * super_admin accounts can only be created via the super_admin panel
 * (adminService.createAdmin) or the CLI bootstrap script.
 */
async function register({ email, password, displayName }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    if (existing.verified) {
      const err = new Error('An account with that email already exists.');
      err.status = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userRepository.updateUnverifiedUser(existing.id, { passwordHash, displayName });
    await issueVerificationCode(user);
    return { user };
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepository.createUser({
    email,
    passwordHash,
    displayName,
    role: 'user',
    verified: false,
  });
  await issueVerificationCode(user);
  return { user };
}

async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  if (!user.verified) {
    await issueVerificationCode(user);
    const err = new Error('Please verify your email before signing in. A new verification code was sent.');
    err.status = 403;
    err.code = 'EMAIL_NOT_VERIFIED';
    throw err;
  }

  if (user.status === 'banned') {
    const err = new Error('This account has been banned.');
    err.status = 403;
    throw err;
  }

  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token: signToken(safeUser) };
}

async function verifyEmail({ email, code }) {
  const user = await userRepository.findByEmail(email);
  if (!user || user.verified || user.verification_code !== code || !user.verification_expires_at || new Date(user.verification_expires_at) < new Date()) {
    const err = new Error('The verification code is invalid or expired.');
    err.status = 400;
    throw err;
  }
  const verifiedUser = await userRepository.verifyUser(user.id);
  const { password_hash, ...safeUser } = verifiedUser;
  return { user: safeUser, token: signToken(safeUser) };
}

module.exports = { register, login, verifyEmail, signToken };
