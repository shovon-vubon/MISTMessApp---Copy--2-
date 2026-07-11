const {onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
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

  return {success: true, message: `Successfully deleted user ${targetUid}`};
});

exports.notifyStudentOnStatusChange = onDocumentUpdated(
    {
      document: "requests/{requestId}",
      region: "asia-southeast1",
    },
    async (event) => {
      const before = event.data.before.data();
      const after = event.data.after.data();

      if (!before || !after) {
        return;
      }

      if (before.status === after.status) {
        return;
      }

      const studentUid = after.studentId;

      let title;
      let body;

      switch (after.status) {
        case "approved":
          title = "Out Pass Approved";
          body = "Your out pass request has been approved.";
          break;

        case "rejected":
          title = "Out Pass Rejected";
          body = "Your out pass request has been rejected.";
          break;

        default:
          return;
      }

      return sendPushNotification(
          studentUid,
          title,
          body,
          {
            type: "request-status",
            requestId: event.params.requestId,
            status: after.status,
          },
      );
    },
);

exports.notifyGsoOnNewRequest = onDocumentCreated(
    {
      document: "requests/{requestId}",
      region: "asia-southeast1",
    },
    async (event) => {
      const request = event.data.data();

      const gsoUsersSnapshot = await admin.firestore().collection("users")
          .where("role", "==", "gso2")
          .where("dept", "==", request.dept)
          .get();

      const promises = [];

      gsoUsersSnapshot.forEach((doc) => {
        promises.push(sendPushNotification(
            doc.id,
            "New Out Pass Request",
            `${request.studentName} has submitted a new out pass request.`,
            {
              type: "new-request",
              requestId: event.params.requestId,
            },
        ));
      });

      return Promise.all(promises);
    },
);

exports.notifyStudentsOnNewNotice = onDocumentCreated(
    {
      document: "notices/{noticeId}",
      region: "asia-southeast1",
    },
    async (event) => {
      const notice = event.data.data();

      const studentsSnapshot = await admin.firestore().collection("users")
          .where("role", "==", "student")
          .get();

      const promises = [];

      studentsSnapshot.forEach((doc) => {
        promises.push(sendPushNotification(
            doc.id,
            notice.title || "New Notice",
            notice.body || "",
            {
              type: "notice",
              noticeId: event.params.noticeId,
            },
        ));
      });

      return Promise.all(promises);
    },
);

exports.notifyGsoOnArrival = onDocumentUpdated(
    {
      document: "requests/{requestId}",
      region: "asia-southeast1",
    },
    async (event) => {
      const before = event.data.before.data();
      const after = event.data.after.data();
      if (before.arrivalSent === after.arrivalSent) {
        return;
      }

      if (!after.arrivalSent) {
        return;
      }

      const gsoUsersSnapshot = await admin.firestore().collection("users")
          .where("role", "==", "gso2")
          .where("dept", "==", after.dept)
          .get();

      const promises = [];

      gsoUsersSnapshot.forEach((doc) => {
        promises.push(sendPushNotification(
            doc.id,
            "Student Arrival Notification",
            `Student ${after.studentName} has arrived.`,
            {
              type: "student-arrival",
              requestId: event.params.requestId,
            },
        ));
      });

      return Promise.all(promises);
    },
);

