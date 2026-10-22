import express from 'express';
import { auth } from '../firebase-admin.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
const PAGE_SIZE = 1000;

router.get('/metrics', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    let pageToken;
    let users = 0;
    let active = 0;

    do {
      const page = await auth.listUsers(PAGE_SIZE, pageToken);
      users += page.users.length;
      active += page.users.filter(user => !user.disabled).length;
      pageToken = page.pageToken;
    } while (pageToken);

    return res.json({ users, active });
  } catch (error) {
    return next(error);
  }
});

export default router;