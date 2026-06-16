# MIST Officers' Mess — React Native PWA Setup

## Firebase Setup (Required Before Running)

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Create new project: "mist-mess-app"
3. Enable Google Analytics (optional)

### 2. Enable Firebase Services
- **Authentication** → Sign-in method → Email/Password → Enable
- **Firestore Database** → Create database → Start in production mode
- **Cloud Messaging** → Note your Server Key and VAPID key

### 3. Get Firebase Config
- Project Settings → Your apps → Add Web App → Copy the `firebaseConfig` object
- Replace placeholders in `firebase.js`

### 4. Get VAPID Key for Web Push
- Project Settings → Cloud Messaging → Web Push certificates → Generate key pair
- Replace `FCM_VAPID_KEY` in `src/constants/config.js`

### 5. Firestore Security Rules
In Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin'];
    }
    match /requests/{reqId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /notifications/{notifId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 6. Pre-Register GSO-2, Dept Head & Admin Accounts
Create these accounts via Firebase Console → Authentication → Add User, then add their Firestore documents in the `users` collection:

**Admin:**
```json
{
  "uid": "<firebase-uid>",
  "name": "Admin",
  "email": "admin@mist.ac.bd",
  "role": "admin",
  "regStatus": "approved"
}
```

**GSO-2 (one per dept):**
```json
{
  "uid": "<firebase-uid>",
  "name": "Maj Imran Hossain",
  "rank": "Maj",
  "email": "gso2.cse@mist.ac.bd",
  "dept": "CSE",
  "role": "gso2",
  "regStatus": "approved"
}
```

**Dept Head:**
```json
{
  "uid": "<firebase-uid>",
  "name": "Col Kabir Uddin",
  "rank": "Col",
  "email": "depthead.cse@mist.ac.bd",
  "dept": "CSE",
  "role": "depthead",
  "regStatus": "approved"
}
```

## Running the App

```bash
# Web (PWA)
npm run web
# Opens at http://localhost:8081

# Build PWA for deployment
npm run build:web
# Output in dist/ folder — deploy to Firebase Hosting, Vercel, or Netlify

# Android (Expo Go)
npm run android

# iOS (Expo Go)
npm run ios
```

## Deploy as PWA to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting    # set public dir to "dist", SPA: yes
npm run build:web
firebase deploy
```

Users can then:
- **Android**: Open in Chrome → Menu → "Add to Home Screen"
- **iOS 16.4+**: Open in Safari → Share → "Add to Home Screen"

## Project Structure

```
MISTMessApp/
├── app/
│   ├── _layout.js          # Root layout with AuthProvider
│   ├── index.js            # Login screen
│   ├── register.js         # Student registration
│   ├── (student)/          # Student tabs (Dashboard, Request, History, Arrival)
│   ├── (gso2)/             # GSO-2 tabs (Dashboard, Pending, Records, Overdue)
│   ├── (depthead)/         # Dept Head tabs (Dashboard, Records)
│   └── (admin)/            # Admin panel
├── src/
│   ├── context/AuthContext.js      # Firebase Auth state
│   ├── hooks/useNotifications.js   # Push notification setup
│   ├── constants/theme.js          # Dark military theme
│   ├── constants/config.js         # Departments, ranks, roles
│   └── components/                 # StatusBadge, MetricCard, FilterBar, AppHeader
├── firebase.js             # Firebase initialization (add your config here)
└── package.json
```

## User Roles & Flow

| Role | Access | Notifications |
|------|--------|---------------|
| Student | Dashboard+Profile, New Request, History, Arrival | Approval/rejection alerts |
| GSO-2 | Dashboard, Pending (approve/reject), Records (filterable), Overdue | New request alerts, Arrival alerts |
| Dept Head | Dashboard (dept summary), Records | Read-only |
| Admin | All users, pending registrations, system overview | Registration alerts |

## Notifications Flow
1. Student submits request → GSO-2 gets push notification
2. GSO-2 approves → Student gets notification
3. Student returns → Taps "I Have Returned" → GSO-2 gets instant arrival notification
