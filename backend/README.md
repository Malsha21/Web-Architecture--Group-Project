# EduLanka backend

Express API for the EduLanka learning platform. Firebase Authentication remains the client-facing sign-in system; this API verifies Firebase ID tokens and uses the Firebase Admin SDK for trusted role and Firestore operations.

## Local setup

1. Install Node.js 18 or newer.
2. From this directory, install dependencies:

   ```powershell
   npm install
   ```

3. Copy `.env.example` to `.env`.
4. Configure Firebase Admin credentials using one of these options:
   - Set `GOOGLE_APPLICATION_CREDENTIALS` to a downloaded Firebase service-account JSON file.
   - Set `FIREBASE_SERVICE_ACCOUNT_JSON` to the complete service-account JSON.
5. Start the API:

   ```powershell
   npm run dev
   ```

The API runs at `http://localhost:3000` by default. Never commit service-account JSON or `.env` files.

## Routes

- `GET /api/health` - public health check.
- `GET /api/users/me` - authenticated user profile.
- `PATCH /api/users/me` - authenticated profile update. Accepts `displayName`, `grade` (`Grade 1` through `Grade 5`), and `language`.
- `GET /api/users` - admin only; lists up to 100 user profiles.
- `PATCH /api/users/:uid/role` - admin only; sets a Firebase custom claim for `student`, `parent`, `teacher`, or `admin`.

Protected requests must include:

```http
Authorization: Bearer <Firebase ID token>
```

## Frontend example

```js
const token = await auth.currentUser.getIdToken();
const response = await fetch('http://localhost:3000/api/users/me', {
  headers: { Authorization: `Bearer ${token}` },
});
```

Roles must be assigned by the trusted Admin SDK endpoint or a server-side process. Do not trust a role sent by the browser for authorization.
