/**
 * Seed script — populates Firebase Emulators with demo accounts and sample data.
 * Run AFTER emulators are started: node scripts/seed.js
 */

process.env.FIRESTORE_EMULATOR_HOST     = 'localhost:8088';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth }      = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Use a fake service account for the demo emulator project
if (!getApps().length) {
  initializeApp({ projectId: 'mist-mess-demo' });
}

const adminAuth = getAuth();
const db        = getFirestore();

// ─── DEMO USERS ────────────────────────────────────────────────────────────
const USERS = [
  // Admin
  { email: 'admin@mist.ac.bd',         password: 'admin123', profile: { name: 'Admin Officer', rank: 'Brig', dept: 'ALL', role: 'admin',    regStatus: 'approved', serviceNumber: 'ADM-001' } },

  // GSO-2 per dept
  { email: 'gso2.cse@mist.ac.bd',      password: 'admin123', profile: { name: 'Maj Imran Hossain', rank: 'Maj', dept: 'CSE',  role: 'gso2',     regStatus: 'approved', serviceNumber: 'GSO-CSE' } },
  { email: 'gso2.ce@mist.ac.bd',       password: 'admin123', profile: { name: 'Maj Fatema Khanam', rank: 'Maj', dept: 'CE',   role: 'gso2',     regStatus: 'approved', serviceNumber: 'GSO-CE'  } },
  { email: 'gso2.me@mist.ac.bd',       password: 'admin123', profile: { name: 'Maj Rifat Alam',    rank: 'Maj', dept: 'ME',   role: 'gso2',     regStatus: 'approved', serviceNumber: 'GSO-ME'  } },
  { email: 'gso2.eece@mist.ac.bd',     password: 'admin123', profile: { name: 'Maj Nusrat Jahan',  rank: 'Maj', dept: 'EECE', role: 'gso2',     regStatus: 'approved', serviceNumber: 'GSO-EECE'} },

  // Dept Heads
  { email: 'depthead.cse@mist.ac.bd',  password: 'admin123', profile: { name: 'Col Kabir Uddin',   rank: 'Col', dept: 'CSE',  role: 'depthead', regStatus: 'approved', serviceNumber: 'DH-CSE'  } },
  { email: 'depthead.ce@mist.ac.bd',   password: 'admin123', profile: { name: 'Col Rashida Begum', rank: 'Col', dept: 'CE',   role: 'depthead', regStatus: 'approved', serviceNumber: 'DH-CE'   } },
  { email: 'depthead.me@mist.ac.bd',   password: 'admin123', profile: { name: 'Col Anwar Hossain', rank: 'Col', dept: 'ME',   role: 'depthead', regStatus: 'approved', serviceNumber: 'DH-ME'   } },
  { email: 'depthead.eece@mist.ac.bd', password: 'admin123', profile: { name: 'Col Mita Rahman',   rank: 'Col', dept: 'EECE', role: 'depthead', regStatus: 'approved', serviceNumber: 'DH-EECE' } },

  // Students
  { email: 'ba001@mist.ac.bd', password: '123456', profile: { name: 'Lt Tanvir Ahmed',   rank: 'Lt',   dept: 'CSE',  role: 'student', regStatus: 'approved', serviceNumber: 'BA-00101', servicePrefix: 'BA', batch: '2022', phone: '01712345678' } },
  { email: 'ba002@mist.ac.bd', password: '123456', profile: { name: 'Capt Rafiq Hossain',rank: 'Capt', dept: 'CSE',  role: 'student', regStatus: 'approved', serviceNumber: 'BA-00102', servicePrefix: 'BA', batch: '2021', phone: '01812345678' } },
  { email: 'bn001@mist.ac.bd', password: '123456', profile: { name: 'Lt Fahmida Khan',   rank: 'Lt',   dept: 'CE',   role: 'student', regStatus: 'approved', serviceNumber: 'BN-00101', servicePrefix: 'BN', batch: '2022', phone: '01912345678' } },
  { email: 'bn002@mist.ac.bd', password: '123456', profile: { name: 'Maj Rahim Uddin',   rank: 'Maj',  dept: 'ME',   role: 'student', regStatus: 'approved', serviceNumber: 'BN-00201', servicePrefix: 'BN', batch: '2020', phone: '01612345678' } },
  { email: 'baf001@mist.ac.bd',password: '123456', profile: { name: 'Lt Salma Begum',    rank: 'Lt',   dept: 'EECE', role: 'student', regStatus: 'approved', serviceNumber: 'BAF-0101', servicePrefix: 'BAF',batch: '2023', phone: '01512345678' } },
  // Pending student (to demo admin approval)
  { email: 'ba003@mist.ac.bd', password: '123456', profile: { name: 'Lt Zahir Islam',    rank: 'Lt',   dept: 'CSE',  role: 'student', regStatus: 'pending',  serviceNumber: 'BA-00103', servicePrefix: 'BA', batch: '2023', phone: '01312345678' } },
];

// ─── SAMPLE REQUESTS ───────────────────────────────────────────────────────
function makeReqs(studentUid, studentName, svcNum, rank, dept) {
  const today  = new Date().toISOString().slice(0, 10);
  const yest   = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  return [
    {
      studentId: studentUid, studentName, serviceNumber: svcNum, rank, dept,
      date: today, outTime: '20:00', expectedReturn: '23:00', actualReturn: null,
      cause: 'Medical appointment at CMH', status: 'pending',
      approvedBy: null, approvedByName: null, remarks: null,
      arrivalSent: false, arrivalTime: null,
      createdAt: FieldValue.serverTimestamp(),
    },
    {
      studentId: studentUid, studentName, serviceNumber: svcNum, rank, dept,
      date: yest, outTime: '19:30', expectedReturn: '22:30', actualReturn: '22:15',
      cause: 'Official duty — regimental function', status: 'approved',
      approvedBy: null, approvedByName: 'Maj Imran Hossain', remarks: 'Approved',
      arrivalSent: true, arrivalTime: '22:15',
      createdAt: FieldValue.serverTimestamp(),
    },
  ];
}

// ─── MAIN SEED ─────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱  Seeding Firebase Emulators...\n');

  const uids = {};

  for (const u of USERS) {
    try {
      // Delete if already exists
      try {
        const existing = await adminAuth.getUserByEmail(u.email);
        await adminAuth.deleteUser(existing.uid);
      } catch {}

      const created = await adminAuth.createUser({ email: u.email, password: u.password, displayName: u.profile.name });
      uids[u.email] = created.uid;

      await db.collection('users').doc(created.uid).set({
        uid: created.uid,
        email: u.email,
        ...u.profile,
        fcmToken: null,
        createdAt: FieldValue.serverTimestamp(),
      });

      console.log(`  ✓  ${u.profile.role.padEnd(10)} ${u.email}`);
    } catch (e) {
      console.error(`  ✗  ${u.email}: ${e.message}`);
    }
  }

  // Add sample requests for first two students
  const student1Email = 'ba001@mist.ac.bd';
  const student2Email = 'bn001@mist.ac.bd';

  const s1 = USERS.find(u => u.email === student1Email);
  const s2 = USERS.find(u => u.email === student2Email);

  if (uids[student1Email] && s1) {
    const reqs = makeReqs(uids[student1Email], s1.profile.name, s1.profile.serviceNumber, s1.profile.rank, s1.profile.dept);
    for (const r of reqs) {
      await db.collection('requests').add(r);
    }
    console.log(`\n  ✓  Sample requests added for ${s1.profile.name}`);
  }

  if (uids[student2Email] && s2) {
    const reqs = makeReqs(uids[student2Email], s2.profile.name, s2.profile.serviceNumber, s2.profile.rank, s2.profile.dept);
    for (const r of reqs) {
      await db.collection('requests').add(r);
    }
    console.log(`  ✓  Sample requests added for ${s2.profile.name}`);
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅  Seeding complete!

  Demo Accounts (password shown):
  ─────────────────────────────────────────────
  ADMIN       admin@mist.ac.bd           admin123
  GSO-2 CSE   gso2.cse@mist.ac.bd        admin123
  GSO-2 CE    gso2.ce@mist.ac.bd         admin123
  GSO-2 ME    gso2.me@mist.ac.bd         admin123
  GSO-2 EECE  gso2.eece@mist.ac.bd       admin123
  DEPTHEAD CSE depthead.cse@mist.ac.bd   admin123
  STUDENT 1   ba001@mist.ac.bd           123456
  STUDENT 2   ba002@mist.ac.bd           123456
  STUDENT 3   bn001@mist.ac.bd           123456
  PENDING     ba003@mist.ac.bd           123456
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
