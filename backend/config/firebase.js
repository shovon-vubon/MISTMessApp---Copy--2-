const admin = require('firebase-admin');

/**
 * Resolve Admin SDK credentials in this order:
 *  1. FIREBASE_SERVICE_ACCOUNT env var (raw JSON or base64) — best for hosting.
 *  2. ./serviceAccount.json file — convenient for local development.
 *  3. Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS).
 */
function resolveCredential() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw && raw.trim()) {
    const text = raw.trim().startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf8');
    return admin.credential.cert(JSON.parse(text));
  }

  try {
    // eslint-disable-next-line global-require
    const serviceAccount = require('../serviceAccount.json');
    return admin.credential.cert(serviceAccount);
  } catch {
    return admin.credential.applicationDefault();
  }
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: resolveCredential() });
}

const db = admin.firestore();
const auth = admin.auth();
const messaging = admin.messaging();

module.exports = { admin, db, auth, messaging };
