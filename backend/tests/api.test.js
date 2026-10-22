import { after, before, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';

// ---------------------------------------------------------------------------
// Setup: fake Firebase credentials, so these tests never need the real
// serviceAccountKey.json and never contact Firebase.
// ---------------------------------------------------------------------------
const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
  type: 'service_account',
  project_id: 'test-project',
  private_key_id: 'test',
  private_key: privateKey,
  client_email: 'test@test-project.iam.gserviceaccount.com',
  client_id: '1',
});
process.env.RATE_LIMIT_MAX = '1000'; // so the rate limiter never interferes with the tests

// Import after the settings above (a normal import would run too early)
const { default: app } = await import('../app.js');
const { auth, db } = await import('../firebase-admin.js');

// Fake users. The token text decides who is "logged in".
const FAKE_USERS = {
  'admin-token': { uid: 'admin1', role: 'admin' },
  'student-token': { uid: 'student1', role: 'student' },
  'no-role-token': { uid: 'someone1' }, // signed in, but has no role at all
};

let server;
let baseUrl;

before(() => {
  mock.method(auth, 'verifyIdToken', async (token) => {
    if (FAKE_USERS[token]) return FAKE_USERS[token];
    throw new Error('Invalid token');
  });
  server = app.listen(0);
  baseUrl = `http://localhost:${server.address().port}`;
});

after(() => {
  mock.restoreAll();
  server.closeAllConnections?.();
  server.close();
});

async function request(path, { method = 'GET', token, scheme = 'Bearer', body } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `${scheme} ${token}`;
  const response = await fetch(baseUrl + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('health check', () => {
  it('GET /api/health returns 200 and status ok', async () => {
    const { status, body } = await request('/api/health');
    assert.equal(status, 200);
    assert.deepEqual(body, { status: 'ok', service: 'edulanka-backend' });
  });
});

describe('401: not signed in', () => {
  it('returns 401 when there is no token', async () => {
    const { status, body } = await request('/api/users/me');
    assert.equal(status, 401);
    assert.equal(body.error, 'Missing Bearer token.');
  });

  it('requires authentication to create quiz questions', async () => {
    const { status, body } = await request('/api/quizzes', {
      method: 'POST',
      body: { question: 'Example?' },
    });
    assert.equal(status, 401);
    assert.equal(body.error, 'Missing Bearer token.');
  });

  it('returns 401 when the Authorization header is not a Bearer token', async () => {
    const { status } = await request('/api/users/me', { token: 'student-token', scheme: 'Basic' });
    assert.equal(status, 401);
  });

  it('returns 401 when the token is invalid', async (t) => {
    t.mock.method(console, 'error', () => {}); // hide the expected error message
    const { status, body } = await request('/api/users/me', { token: 'not-a-real-token' });
    assert.equal(status, 401);
    assert.equal(body.error, 'Invalid or expired authentication token.');
  });
});

describe('403: signed in but wrong role', () => {
  it('a student cannot list users', async () => {
    const { status } = await request('/api/users', { token: 'student-token' });
    assert.equal(status, 403);
  });

  it('a student cannot create quiz questions', async () => {
    const { status } = await request('/api/quizzes', {
      method: 'POST',
      token: 'student-token',
      body: { question: 'Example?' },
    });
    assert.equal(status, 403);
  });

  it('a student cannot access admin metrics', async () => {
    const { status } = await request('/api/admin/metrics', { token: 'student-token' });
    assert.equal(status, 403);
  });

  it('a user with no role cannot list users', async () => {
    const { status } = await request('/api/users', { token: 'no-role-token' });
    assert.equal(status, 403);
  });

  it('a student cannot change roles', async () => {
    const { status } = await request('/api/users/student1/role', {
      method: 'PATCH',
      token: 'student-token',
      body: { role: 'admin' },
    });
    assert.equal(status, 403);
  });
});

describe('admin rules and input checks', () => {
  it('rejects incomplete quiz questions', async () => {
    const { status, body } = await request('/api/quizzes', {
      method: 'POST',
      token: 'admin-token',
      body: { subject: 'Mathematics', question: 'Example?' },
    });
    assert.equal(status, 400);
    assert.match(body.error, /grade must be/);
  });

  it('creates a validated quiz question in Firestore', async (t) => {
    let savedQuestion;
    t.mock.method(db, 'collection', (name) => {
      assert.equal(name, 'quiz_questions');
      return {
        add: async (question) => {
          savedQuestion = question;
          return { id: 'question-123' };
        },
      };
    });

    const { status, body } = await request('/api/quizzes', {
      method: 'POST',
      token: 'admin-token',
      body: {
        subject: 'Mathematics',
        grade: 'Grade 3',
        language: 'English',
        difficulty: 'Medium',
        question: 'What is 5 + 3?',
        options: ['6', '7', '8', '9'],
        correct: 2,
        hint: 'Count on.',
      },
    });

    assert.equal(status, 201);
    assert.equal(body.id, 'question-123');
    assert.equal(body.correct, 2);
    assert.equal(savedQuestion.createdBy, 'admin1');
  });

  it('returns total and enabled account metrics across Firebase Auth pages', async (t) => {
    t.mock.method(auth, 'listUsers', async (_maxResults, pageToken) => pageToken
      ? { users: [{ disabled: false }] }
      : { users: [{ disabled: false }, { disabled: true }], pageToken: 'next-page' });

    const { status, body } = await request('/api/admin/metrics', { token: 'admin-token' });
    assert.equal(status, 200);
    assert.deepEqual(body, { users: 3, active: 2 });
  });

  it('an admin cannot remove their own admin role', async () => {
    const { status, body } = await request('/api/users/admin1/role', {
      method: 'PATCH',
      token: 'admin-token',
      body: { role: 'teacher' },
    });
    assert.equal(status, 403);
    assert.equal(body.error, 'Admins cannot remove their own admin role.');
  });

  it('rejects a role that does not exist', async () => {
    const { status } = await request('/api/users/student1/role', {
      method: 'PATCH',
      token: 'admin-token',
      body: { role: 'king' },
    });
    assert.equal(status, 400);
  });

  it('rejects limit values outside 1 to 100', async () => {
    for (const limit of ['0', '101', 'abc']) {
      const { status } = await request(`/api/users?limit=${limit}`, { token: 'admin-token' });
      assert.equal(status, 400, `limit=${limit} should be rejected`);
    }
  });

  it('rejects fields that are not allowed', async () => {
    const { status } = await request('/api/users?fields=password', { token: 'admin-token' });
    assert.equal(status, 400);
  });
});

describe('unknown routes', () => {
  it('returns 404 with a JSON error', async () => {
    const { status, body } = await request('/api/does-not-exist');
    assert.equal(status, 404);
    assert.equal(body.error, 'Route not found.');
  });
});
