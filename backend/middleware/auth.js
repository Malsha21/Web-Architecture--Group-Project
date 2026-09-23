import { auth } from '../firebase-admin.js';

export async function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing Bearer token.' });
  }

  try {
    // firebaseAuth වෙනුවට අපි firebase-admin.js එකෙන් export කළ 'auth' නම මෙහි යොදා ඇත
    req.user = await auth.verifyIdToken(token);
    return next();
  } catch (error) {
    console.error('Token verification failed:', error.code || error.message);
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = String(req.user?.role || '').toLowerCase();

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'You do not have permission to access this resource.' });
    }

    return next();
  };
}
