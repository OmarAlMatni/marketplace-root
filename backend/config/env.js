/**
 * Fail-Safe Environmental Inspector.
 * Crashes the boot phase intentionally with a clear message if any
 * required environment variable is missing, so we never run a
 * silently-broken partial instance in production.
 */
require('dotenv').config();

const REQUIRED_VARS = ['DATABASE_URL', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'JWT_SECRET'];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error('\n❌ FATAL: Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\nCopy .env.example to .env and fill in real values before starting the server.\n');
    process.exit(1);
  }
}

module.exports = { validateEnv };
