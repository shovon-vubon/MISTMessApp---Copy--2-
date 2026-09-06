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

const HIGH_PRIORITY_CAUSES = ["Medical Emergency", "Blood Donation"];
const MEDIUM_PRIORITY_CAUSES = ["Family Meeting"];
const HIGH_PRIORITY_KEYWORDS = /\b(emg|emergency)\b/i;
const MEDIUM_PRIORITY_KEYWORDS = /\b(mdm|medium)\b/i;

/**
 * Derives request priority from the student's stated reason.
 *
 * @param {string} cause The reason text stored on the request.
 * @return {string} One of "high", "medium", "low".
 */
function getPriority(cause) {
  if (HIGH_PRIORITY_CAUSES.includes(cause)) return "high";
  if (MEDIUM_PRIORITY_CAUSES.includes(cause)) return "medium";
  if (HIGH_PRIORITY_KEYWORDS.test(cause)) return "high";
  if (MEDIUM_PRIORITY_KEYWORDS.test(cause)) return "medium";
  return "low";
}

const PRIORITY_LABELS = {
  high: "🔴 HIGH PRIORITY",
  medium: "🟡 MEDIUM PRIORITY",
  low: "",
};


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
