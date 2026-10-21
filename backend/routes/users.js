import express from 'express';
import { FieldPath } from 'firebase-admin/firestore';
import { auth, db } from '../firebase-admin.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
const allowedRoles = new Set(['student', 'parent', 'teacher', 'admin']);
const allowedProfileFields = new Set(['displayName', 'grade', 'language']);

// Only these fields can ever be returned by GET /api/users.
// Anything not listed here (for example tokens or internal data) is never sent.
const LIST_FIELDS = [
  'displayName', 'name', 'email', 'role', 'grade', 'language',
  'coins', 'stars', 'createdAt', 'updatedAt',
];
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function pickFields(data, fields) {
  const result = {};
  for (const field of fields) {
    if (data[field] !== undefined) result[field] = data[field];
  }
  return result;
}

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const snapshot = await db.collection('users').doc(req.user.uid).get();
    const data = snapshot.exists ? snapshot.data() : {};
    // Role must come from the verified token claim (set by admin), not from the stored profile.
    return res.json({
      ...data,
      uid: req.user.uid,
      email: req.user.email || data.email || null,
      role: req.user.role || data.role || 'student',
    });
  } catch (error) {
    return next(error);
  }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  const updates = Object.fromEntries(
    Object.entries(req.body || {}).filter(([key]) => allowedProfileFields.has(key)),
  );

  if (updates.grade && !/^Grade [1-5]$/.test(updates.grade)) {
    return res.status(400).json({ error: 'Grade must be Grade 1 through Grade 5.' });
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid profile fields were provided.' });
  }

  try {
    await db.collection('users').doc(req.user.uid).set(
      { ...updates, updatedAt: new Date().toISOString() },
      { merge: true },
    );
    return res.json({ message: 'Profile updated.', updates });
  } catch (error) {
    return next(error);
  }
});

// GET /api/users?limit=25&startAfter=<last uid>&fields=email,role
router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  // limit: how many users to return (1 to 100, default 25)
  const limit = req.query.limit === undefined ? DEFAULT_LIMIT : Number(req.query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return res.status(400).json({ error: `limit must be a whole number from 1 to ${MAX_LIMIT}.` });
  }

  // startAfter: the nextStartAfter value from the previous page
  const { startAfter } = req.query;
  if (startAfter !== undefined && (typeof startAfter !== 'string' || startAfter.trim() === '')) {
    return res.status(400).json({ error: 'startAfter must be a user id.' });
  }

  // fields: optional, narrows the response to some of the allowed fields
  let fields = LIST_FIELDS;
  if (req.query.fields !== undefined) {
    const requested = String(req.query.fields).split(',').map((f) => f.trim()).filter(Boolean);
    const invalid = requested.filter((f) => !LIST_FIELDS.includes(f));
    if (requested.length === 0 || invalid.length > 0) {
      return res.status(400).json({
        error: `fields must be a comma-separated list of: ${LIST_FIELDS.join(', ')}.`,
      });
    }
    fields = requested;
  }

  try {
    let query = db.collection('users')
      .orderBy(FieldPath.documentId())
      .limit(limit + 1); // one extra document tells us whether another page exists
    if (startAfter) query = query.startAfter(startAfter);

    const snapshot = await query.get();
    const hasMore = snapshot.docs.length > limit;
    const pageDocs = snapshot.docs.slice(0, limit);

    return res.json({
      users: pageDocs.map((document) => ({ id: document.id, ...pickFields(document.data(), fields) })),
      count: pageDocs.length,
      nextStartAfter: hasMore ? pageDocs[pageDocs.length - 1].id : null,
    });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:uid/role', requireAuth, requireRole('admin'), async (req, res, next) => {
  const role = String(req.body?.role || '').toLowerCase();

  if (!allowedRoles.has(role)) {
    return res.status(400).json({ error: 'Role must be student, parent, teacher, or admin.' });
  }

  // An admin must not remove their own admin role (prevents locking everyone out)
  if (req.params.uid === req.user.uid && role !== 'admin') {
    return res.status(403).json({ error: 'Admins cannot remove their own admin role.' });
  }

  try {
    const user = await auth.getUser(req.params.uid);
    await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), role });
    await db.collection('users').doc(user.uid).set({ role, updatedAt: new Date().toISOString() }, { merge: true });
    return res.json({ message: 'Role updated. The user must refresh their ID token.', uid: user.uid, role });
  } catch (error) {
    return next(error);
  }
});

export default router;
