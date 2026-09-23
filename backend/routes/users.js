import express from 'express';
import { auth, db } from '../firebase-admin.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
const allowedRoles = new Set(['student', 'parent', 'teacher', 'admin']);
const allowedProfileFields = new Set(['displayName', 'grade', 'language']);

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const snapshot = await db.collection('users').doc(req.user.uid).get();
    return res.json({
      uid: req.user.uid,
      email: req.user.email || null,
      role: req.user.role || 'student',
      ...(snapshot.exists ? snapshot.data() : {}),
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

router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const snapshot = await db.collection('users').limit(100).get();
    return res.json({ users: snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:uid/role', requireAuth, requireRole('admin'), async (req, res, next) => {
  const role = String(req.body?.role || '').toLowerCase();

  if (!allowedRoles.has(role)) {
    return res.status(400).json({ error: 'Role must be student, parent, teacher, or admin.' });
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