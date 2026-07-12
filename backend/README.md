# MIST Mess Backend

Secure Node.js + Express API that owns the sensitive out-pass actions
(approve / reject / arrival): it verifies the caller's Firebase ID token,
checks their role, updates Firestore with the Admin SDK, and sends the FCM
push notification — so notifications work even when the student's app is closed.

## Endpoints

All require header: `Authorization: Bearer <Firebase ID token>`

| Method | Path                         | Who        | Body          |
|--------|------------------------------|------------|---------------|
| POST   | `/api/requests/:id/approve`  | gso2/admin/depthead | —      |
| POST   | `/api/requests/:id/reject`   | gso2/admin/depthead | `{ remarks }` |
| POST   | `/api/requests/:id/arrival`  | student (owner)     | —      |
| GET    | `/health`                    | public     | —             |

## Local setup

1. Get a service account key: Firebase Console → Project Settings →
   **Service accounts** → **Generate new private key**. Save it as
   `backend/serviceAccount.json` (already git-ignored).
2. Install and run:
   ```bash
   cd backend
   npm install
   cp .env.example .env   # adjust if needed
   npm run dev
   ```
3. Server starts on `http://localhost:8080`. Test: `curl localhost:8080/health`.

## Deploying (Render example)

1. Push this repo to GitHub.
2. Render → New → **Web Service** → pick the repo, root directory `backend`.
3. Build command `npm install`, start command `npm start`.
4. Environment variables:
   - `FIREBASE_SERVICE_ACCOUNT` = the full contents of `serviceAccount.json`
     (paste as one line, or base64-encode it). **Do not** commit the file.
   - `CORS_ORIGIN` = `https://localhost` (the Capacitor WebView origin) once
     you stop testing with `*`.
5. After deploy, note the public URL, e.g.
   `https://mist-mess-backend.onrender.com`, and set it as `API_BASE` in
   the app at `src/config/api.js`.

## Security notes

- The Admin SDK bypasses Firestore rules, so the server can write regardless
  of client rules. Consider tightening `firestore.rules` to forbid clients
  from updating `requests.status` directly, so the backend is the only path.
- Never bundle `serviceAccount.json` or `firebase-admin` into the app.
