const { admin, db } = require('../config/firebase');
const { sendPushNotification } = require('../services/notificationService');

const { FieldValue } = admin.firestore;

function loadRequest(id) {
  return db.doc(`requests/${id}`).get();
}

/** GSO-2 / admin / depthead approves a pending request. */
async function approve(req, res) {
  const { id } = req.params;
  const snap = await loadRequest(id);
  if (!snap.exists) return res.status(404).json({ error: 'Request not found' });

  const request = snap.data();

  // GSO-2 may only act within their own department.
  if (req.profile.role === 'gso2' && request.dept !== req.profile.dept) {
    return res.status(403).json({ error: 'Cannot approve requests outside your department' });
  }

  await snap.ref.update({
    status: 'approved',
    approvedBy: req.profile.uid,
    approvedByName: req.profile.name,
    approvedAt: FieldValue.serverTimestamp(),
  });

  const push = await sendPushNotification(
    request.studentId,
    'Out-Pass Approved ✅',
    `Your out-pass${request.date ? ` for ${request.date}` : ''} has been approved by ${req.profile.name}.`,
    { type: 'approval', reqId: id, status: 'approved' }
  );

  return res.json({ ok: true, push });
}

/** GSO-2 / admin / depthead rejects a request, with optional remarks. */
async function reject(req, res) {
  const { id } = req.params;
  const remarks = String(req.body?.remarks || '').slice(0, 500);

  const snap = await loadRequest(id);
  if (!snap.exists) return res.status(404).json({ error: 'Request not found' });

  const request = snap.data();

  if (req.profile.role === 'gso2' && request.dept !== req.profile.dept) {
    return res.status(403).json({ error: 'Cannot reject requests outside your department' });
  }

  await snap.ref.update({
    status: 'rejected',
    approvedBy: req.profile.uid,
    approvedByName: req.profile.name,
    remarks,
    approvedAt: FieldValue.serverTimestamp(),
  });

  const push = await sendPushNotification(
    request.studentId,
    'Out-Pass Rejected ❌',
    `Your out-pass${request.date ? ` for ${request.date}` : ''} was rejected${remarks ? `: ${remarks}` : '.'}`,
    { type: 'rejection', reqId: id, status: 'rejected' }
  );

  return res.json({ ok: true, push });
}

/** Student records their return to mess; notifies the department's GSO-2(s). */
async function arrival(req, res) {
  const { id } = req.params;
  const snap = await loadRequest(id);
  if (!snap.exists) return res.status(404).json({ error: 'Request not found' });

  const request = snap.data();

  // Only the owning student may record arrival for their request.
  if (request.studentId !== req.profile.uid) {
    return res.status(403).json({ error: 'You can only record arrival for your own request' });
  }

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  await snap.ref.update({
    arrivalSent: true,
    arrivalTime: timeStr,
    actualReturn: timeStr,
    arrivalSentAt: FieldValue.serverTimestamp(),
  });

  // Notification record so the GSO-2 dashboard's existing arrival listener works.
  await db.collection('notifications').add({
    type: 'arrival',
    fromUid: req.profile.uid,
    fromName: req.profile.name,
    serviceNumber: req.profile.serviceNumber || null,
    dept: req.profile.dept,
    reqId: id,
    arrivalTime: timeStr,
    message: `${req.profile.name} (${req.profile.serviceNumber || req.profile.dept}) has returned to mess at ${timeStr} hrs.`,
    toRole: 'gso2',
    toDept: req.profile.dept,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Push to every GSO-2 of the student's department.
  const officers = await db
    .collection('users')
    .where('role', '==', 'gso2')
    .where('dept', '==', req.profile.dept)
    .get();

  let notified = 0;
  for (const officer of officers.docs) {
    // eslint-disable-next-line no-await-in-loop
    const result = await sendPushNotification(
      officer.id,
      'Student Returned 🏠',
      `${req.profile.name} (${req.profile.serviceNumber || req.profile.dept}) returned to mess at ${timeStr} hrs.`,
      { type: 'arrival', reqId: id }
    );
    if (result.ok) notified += 1;
  }

  return res.json({ ok: true, arrivalTime: timeStr, notified });
}

module.exports = { approve, reject, arrival };
