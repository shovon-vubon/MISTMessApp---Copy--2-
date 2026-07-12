const { auth, db } = require('../config/firebase');

/**
 * Verifies the Firebase ID token in the Authorization header and loads the
 * caller's Firestore profile. Attaches { uid } and { profile } to req.
 * Never trust the client — every protected route runs through this.
 */
async function verifyAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer (.+)$/i);
    if (!match) {
      return res.status(401).json({ error: 'Missing Authorization bearer token' });
    }

    const decoded = await auth.verifyIdToken(match[1]);
    req.uid = decoded.uid;

    const snap = await db.doc(`users/${decoded.uid}`).get();
    if (!snap.exists) {
      return res.status(403).json({ error: 'User profile not found' });
    }
    req.profile = { uid: decoded.uid, ...snap.data() };

    return next();
  } catch (err) {
    console.error('[auth] token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Restricts a route to the given roles. Use after verifyAuth. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.profile || !roles.includes(req.profile.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}

module.exports = { verifyAuth, requireRole };
