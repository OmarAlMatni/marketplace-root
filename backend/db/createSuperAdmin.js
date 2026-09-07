/**
 * Bootstraps the first super_admin account. Public registration can never
 * create admin or super_admin roles, so this CLI script is the only way
 * to seed one — run it once against your database, then use the
 * super_admin's own login + the "Admin Accounts" panel to create more.
 *
 * Usage:
 *   node db/createSuperAdmin.js owner@example.com "a-strong-password" "Site Owner"
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function main() {
  const [, , email, password, displayName] = process.argv;

  if (!email || !password) {
    console.error('Usage: node db/createSuperAdmin.js <email> <password> [displayName]');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, role, status)
       VALUES ($1, $2, $3, 'super_admin', 'active')
       ON CONFLICT (email) DO UPDATE SET role = 'super_admin', status = 'active'
       RETURNING id, email, role`,
      [email, passwordHash, displayName || 'Super Admin']
    );
    console.log('✅ Super admin ready:', rows[0]);
  } catch (err) {
    console.error('❌ Failed to create super admin:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
