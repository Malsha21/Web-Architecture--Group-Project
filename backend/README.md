# EduLanka backend

Express API for the EduLanka learning platform. Firebase Authentication remains the client-facing sign-in system; this API verifies Firebase ID tokens and uses the Firebase Admin SDK for trusted role and Firestore operations.

## Local setup

1. Install Node.js 18 or newer.
2. From this directory, install dependencies:

   ```powershell
   npm install
   ```

3. Copy `.env.example` to `.env`:

   ```powershell
   copy .env.example .env
   ```

4. Configure Firebase Admin credentials using one of these options (the API checks them in this order):
   - Set `FIREBASE_SERVICE_ACCOUNT_JSON` to the complete service-account JSON on one line.
   - Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of a downloaded Firebase service-account JSON file.
   - Place the downloaded file in this folder as `serviceAccountKey.json`.
5. Start the API:

   ```powershell
   npm run dev
   ```

The API runs at `http://localhost:3000` by default. Never commit service-account JSON or `.env` files.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port the API listens on. |
| `FRONTEND_ORIGIN` | `http://localhost:8443` | Comma-separated list of frontend addresses allowed by CORS. The Vite frontend runs at `http://localhost:8443`; VS Code Live Server uses `http://localhost:5500,http://127.0.0.1:5500`. |
| `RATE_LIMIT_MAX` | `100` | Maximum requests per IP address every 15 minutes (all `/api` routes except the health check). |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | none | Complete service-account JSON. |
| `GOOGLE_APPLICATION_CREDENTIALS` | none | Path to the service-account JSON file. |

## Scripts

- `npm run dev` - start with automatic restart when files change.
- `npm start` - start normally.
- `npm run check` - check the source files for syntax errors.
- `npm test` - run the automated API tests.

## Tests

```powershell
npm test
```

The tests use Node's built-in test runner (`node --test`), so no extra packages are needed. They use fake Firebase credentials and a fake token check, so they do not need `serviceAccountKey.json`, a `.env` file or an internet connection. They cover:

- the health endpoint (`200`)
- requests without a token, with a wrong header, or with an invalid token (`401`)
- signed-in users with the wrong role or no role (`403`)
- an admin trying to remove their own admin role (`403`)
- invalid `role`, `limit` and `fields` values (`400`)
- unknown routes (`404`)

The tests are in `tests/api.test.js`.

## Security

- `helmet` sets secure HTTP headers on every response.
- `express-rate-limit` limits each IP address to `RATE_LIMIT_MAX` requests per 15 minutes. Extra requests receive `429` with `{ "error": "Too many requests. Please try again later." }`.
- Request bodies are limited to 100 KB.
- Only the origins in `FRONTEND_ORIGIN` can call the API from a browser.

## Routes

Protected requests must include:

```http
Authorization: Bearer <Firebase ID token>
```

### `GET /api/health`

Public health check. Returns `{ "status": "ok", "service": "edulanka-backend" }`.

### `GET /api/users/me`

Authenticated. Returns the signed-in user's profile.

### `PATCH /api/users/me`

Authenticated. Updates the signed-in user's profile. Accepts these fields only:

- `displayName`
- `grade`: `Grade 1` through `Grade 5`
- `language`

Returns `400` if the grade is invalid or no valid field is sent.

### `GET /api/users`

Admin only. Lists user profiles one page at a time.

| Query parameter | Default | Description |
| --- | --- | --- |
| `limit` | `25` | Number of users per page, 1 to 100. |
| `startAfter` | none | The `nextStartAfter` value from the previous page. Leave out for the first page. |
| `fields` | all allowed fields | Comma-separated list to return only some fields. |

Allowed fields: `displayName`, `name`, `email`, `role`, `grade`, `language`, `coins`, `stars`, `createdAt`, `updatedAt`. Any other stored field is never returned.

Example:

```http
GET /api/users?limit=2&fields=email,role
```

```json
{
  "users": [
    { "id": "uid1", "email": "a@example.com", "role": "student" },
    { "id": "uid2", "email": "b@example.com", "role": "teacher" }
  ],
  "count": 2,
  "nextStartAfter": "uid2"
}
```

To get the next page, send `startAfter=uid2`. When `nextStartAfter` is `null`, there are no more pages. Invalid `limit`, `startAfter` or `fields` values return `400`.

### `PATCH /api/users/:uid/role`

Admin only. Sets a Firebase custom claim and updates the Firestore profile for `student`, `parent`, `teacher`, or `admin`.

Body: `{ "role": "teacher" }`

- Returns `400` if the role is not allowed.
- Returns `403` if an admin tries to change their own role to anything other than `admin`.
- The user must refresh their ID token to receive the new role.

### Errors

| Status | Meaning |
| --- | --- |
| `400` | Invalid input. |
| `401` | Missing or invalid token. |
| `403` | Signed in, but the role is not allowed. |
| `404` | Route not found. |
| `429` | Too many requests. |
| `500` | Internal server error. |

## Frontend example

```js
const token = await auth.currentUser.getIdToken();
const response = await fetch('http://localhost:3000/api/users/me', {
  headers: { Authorization: `Bearer ${token}` },
});
```

Roles must be assigned by the trusted Admin SDK endpoint or a server-side process. Do not trust a role sent by the browser for authorization.
