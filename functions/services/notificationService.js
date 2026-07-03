const {db, messaging} = require("../config/firebase");

const INVALID_TOKEN_CODES = [
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
];

/**
 * Sends a push notification to a user.
 *
 * @param {string} uid Recipient user ID.
 * @param {string} title Notification title.
 * @param {string} body Notification body.
 * @param {Object<string, string>} data Additional payload.
 * @return {Promise<Object>} Result of the send operation.
 */
async function sendPushNotification(uid, title, body, data = {}) {
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists) {
    console.warn(`[push] user not found: ${uid}`);
    return {ok: false, reason: "user-not-found"};
  }

  const token = snap.get("fcmToken");
  if (!token) {
    console.warn(`[push] no fcmToken for user: ${uid}`);
    return {ok: false, reason: "no-token"};
  }

  // FCM requires every data value to be a string.
  const stringData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)]),
  );

  const message = {
    token,
    notification: {title, body},
    data: stringData,
    android: {
      priority: "high",
      notification: {sound: "default"},
    },
  };

  try {
    const id = await messaging.send(message);
    console.log(`[push] sent to ${uid}: ${id}`);
    return {ok: true, id};
  } catch (err) {
    console.error(
        `[push] send failed for ${uid}: ${err.code || ""} ${err.message}`,
    );
    if (INVALID_TOKEN_CODES.includes(err.code)) {
      await db.doc(`users/${uid}`).update({fcmToken: null}).catch(() => {});
      console.log(`[push] cleared invalid token for ${uid}`);
    }
    return {ok: false, reason: err.code || "send-failed"};
  }
}

module.exports = {sendPushNotification};
