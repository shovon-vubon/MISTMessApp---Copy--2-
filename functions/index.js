<<<<<<<<< Temporary merge branch 1
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const logger = require('firebase-functions/logger');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

/**
 * Sends a push notification to the student when an officer approves or rejects
 * their out-pass request.
 *
 * Trigger: any update to a document in the `requests` collection.
 * Fires only when `status` transitions INTO 'approved' or 'rejected'.
 */
exports.notifyOnRequestDecision = onDocumentUpdated('requests/{reqId}', async (event) => {
  const before = event.data?.before?.data();
  const after  = event.data?.after?.data();
  if (!before || !after) return;

  // Only act on a real decision transition (pending -> approved/rejected).
  const isDecision = after.status === 'approved' || after.status === 'rejected';
  if (!isDecision || before.status === after.status) {
    return;
  }

  const studentId = after.studentId;
  if (!studentId) {
    logger.warn('Request has no studentId', { reqId: event.params.reqId });
    return;
  }

  const userSnap = await getFirestore().doc(`users/${studentId}`).get();
  const token = userSnap.get('fcmToken');
  if (!token) {
    logger.warn('Student has no fcmToken; skipping push', { studentId });
    return;
  }

  const approved = after.status === 'approved';
  const dateStr  = after.date ? ` for ${after.date}` : '';
  const officer  = after.approvedByName ? ` by ${after.approvedByName}` : '';

  const title = approved ? 'Out-Pass Approved ✅' : 'Out-Pass Rejected ❌';
  const body  = approved
    ? `Your out-pass${dateStr} has been approved${officer}.`
    : `Your out-pass${dateStr} was rejected${after.remarks ? `: ${after.remarks}` : '.'}`;

  // Data-only message: MyFirebaseMessagingService reads title/body from data
  // and displays the notification in foreground, background, and killed states.
  const message = {
    token,
    data: {
      title,
      body,
      type:   approved ? 'approval' : 'rejection',
      reqId:  String(event.params.reqId),
      status: after.status,
    },
    android: {
      priority: 'high',
    },
  };

  try {
    const messageId = await getMessaging().send(message);
    logger.info('Push sent', { studentId, status: after.status, messageId });
  } catch (err) {
    logger.error('Push send failed', { studentId, code: err.code, message: err.message });

    // Remove tokens that FCM reports as permanently invalid so we stop retrying.
    if (
      err.code === 'messaging/registration-token-not-registered' ||
      err.code === 'messaging/invalid-registration-token' ||
      err.code === 'messaging/invalid-argument'
    ) {
      await getFirestore().doc(`users/${studentId}`).update({ fcmToken: null });
      logger.info('Cleared invalid fcmToken', { studentId });
    }
  }
});
=========
/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const functions = require("firebase-functions");
const {admin} = require("./config/firebase");
const {sendPushNotification} = require("./services/notificationService");

setGlobalOptions({maxInstances: 10});


exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be signed in.",
    );
  }

  const callerUid = context.auth.uid;
  const targetUid = data.targetUid;

  // 1. Fetch the roles of both the caller and the target user
  const [callerSnap, targetSnap] = await Promise.all([
    admin.firestore().collection("users").doc(callerUid).get(),
    admin.firestore().collection("users").doc(targetUid).get(),
  ]);

  const callerRole = callerSnap.exists ? callerSnap.data().role : null;
  const targetRole = targetSnap.exists ? targetSnap.data().role : null;

  // 2. Rule: Only GSO-2 or Admins are allowed to initiate deletions
  if (callerRole !== "gso2" && callerRole !== "admin") {
    throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to delete users.",
    );
  }

  // 3. Rule: Admins cannot delete a GSO-2 user
  if (targetRole === "gso2" && callerRole !== "gso2") {
    throw new functions.https.HttpsError(
        "permission-denied",
        "Admins are not permitted to delete GSO-2 users.",
    );
  }

  // 4. Perform the deletion
  await admin.auth().deleteUser(targetUid);
  await admin.firestore().collection("users").doc(targetUid).delete();

  return { success: true, message: `Successfully deleted user ${targetUid}` };
});

>>>>>>>>> Temporary merge branch 2
