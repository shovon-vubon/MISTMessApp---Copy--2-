# Out Pass Register — MIST

A cross-platform (Android / iOS / Web) digital out-pass system for MIST student officers. Students request permission to leave the mess, GSO-2 duty officers approve or reject those requests and track who hasn't returned, dept heads get read-only visibility, and admins manage accounts — all with real-time push notifications.

## Tech stack

| Layer | Technology |
|---|---|
| App | React Native 0.74 + [Expo](https://expo.dev) SDK 51, routed with [expo-router](https://expo.github.io/router/) (file-based routing) |
| UI | [react-native-paper](https://reactnativepaper.com/) (theming) + custom dark "military" design tokens |
| Native wrapper | [Capacitor](https://capacitorjs.com/) — wraps the exported web build as a native Android app (`android/`) |
| Auth & data | [Firebase](https://firebase.google.com/) — Authentication (email/password) + Firestore |
| Sensitive writes | Standalone Node/Express API (`backend/`) using the Firebase Admin SDK, so approve/reject/arrival actions are verified server-side |
| Push notifications | Firebase Cloud Functions (`functions/`) trigger FCM pushes on Firestore writes; `expo-notifications` / Capacitor plugins receive them client-side |
| State | React Context (`AuthContext`) + local component state — no Redux/MobX |

## Architecture

```
                     ┌─────────────────────┐
                     │   Expo / RN client  │
                     │  (app/, src/)       │
                     └─────────┬───────────┘
             reads/writes      │      approve / reject / arrival
             (client SDK)      │      (needs server-side trust)
                     ┌─────────┴───────────┐
                     │                     │
                     ▼                     ▼
            ┌─────────────────┐   ┌──────────────────┐
            │    Firestore    │   │  backend/ (Express)│
            │  (users,        │◄──┤  verifies Firebase │
            │   requests,     │   │  ID token + role,  │
            │   notices,      │   │  writes via Admin  │
            │   notifications)│   │  SDK, sends FCM     │
            └────────┬────────┘   └──────────────────┘
                     │ onWrite triggers
                     ▼
            ┌─────────────────┐
            │ functions/       │
            │ (Cloud Functions)│
            │ send FCM pushes  │
            └─────────────────┘
```

The client talks to Firestore directly for reads and low-stakes writes, but the three sensitive out-pass actions (**approve**, **reject**, **arrival**) go through `backend/` so a role check and the push notification always happen server-side, even if the requesting app is compromised or closed. See [backend/README.md](backend/README.md) for endpoints and deployment.

## Roles & flow

| Role | Route group | Screens | Can do |
|---|---|---|---|
| Student | `app/(student)/` | Dashboard, New Request, History, Notices, Arrival (hidden tab) | Submit out-pass requests, view history/status, mark "I Have Returned" |
| GSO-2 (duty officer) | `app/(gso2)/` | Dashboard, Notices, Records, Overdue, Students | Approve/reject requests, publish notices, monitor overdue students |
| Dept Head | `app/(depthead)/` | Dashboard, Records | Read-only visibility into department records |
| Admin | `app/(admin)/` (Stack) | Admin Panel, Students, GSO-2 Officers, Dept Heads | Manage user accounts and pending registrations across all depts |

1. Student submits a request → GSO-2 for that department gets a push notification.
2. GSO-2 approves/rejects → student gets notified.
3. Student returns and taps "I Have Returned" → GSO-2 gets an instant arrival notification; overdue tracking clears.

Each role's `_layout.js` (e.g. [app/(gso2)/_layout.js](app/(gso2)/_layout.js)) checks `profile.role` from `AuthContext` and redirects users to their own home if they land in the wrong group. New accounts start with `regStatus: 'pending'` until an admin approves them.

## Project structure

```
app/                      Expo Router routes (file-based)
├── _layout.js             Root Stack — wraps app in AuthProvider + PaperProvider, gates protected routes
├── index.js                Login (service number or email + password)
├── register.js              Student self-registration
├── forgot-password.js
├── (student)/               Student tabs
├── (gso2)/                  GSO-2 tabs
├── (depthead)/               Dept Head tabs
└── (admin)/                  Admin Stack

src/
├── components/              NavHeader, AppHeader, TabBarIcon, StatusBadge, MetricCard, FilterBar
├── context/AuthContext.js   Firebase auth state, profile doc, role redirects
├── constants/                theme.js (design tokens), config.js (roles/depts/ranks/status enums)
├── hooks/useNotifications.js Push notification registration
├── config/api.js             Backend API base URL
└── utils/                    api.js (authenticated fetch), notify.js (local notify helper)

backend/                   Express API for approve/reject/arrival — see backend/README.md
functions/                 Firebase Cloud Functions — FCM push triggers on Firestore writes
firebase.js                Client-side Firebase init
firestore.rules / firestore.indexes.json
```

## Data model (Firestore)

| Collection | Purpose |
|---|---|
| `users` | Profile per account — `role`, `dept`, `rank`, `regStatus`, `fcmToken`, etc. |
| `requests` | Out-pass requests — `studentId`, `dept`, `status` (pending/approved/rejected), `date`, `arrivalSent` |
| `notices` | Department notices published by GSO-2/admin |
| `notifications` | In-app notification records |
| `serviceNumbers` | Public-read lookup of service number → email, used at login before auth |

## Getting started

See [SETUP.md](SETUP.md) for Firebase project setup, security rules, pre-registering GSO-2/Dept Head/Admin accounts, and run/build/deploy commands. See [backend/README.md](backend/README.md) for running and deploying the Express API.
