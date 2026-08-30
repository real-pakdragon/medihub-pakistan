import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { createHttpError } from '../lib/httpError.js';

export function requireAdmin(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next(createHttpError(401, 'Authentication required.'));

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.admin = payload;
    next();
  } catch {
    next(createHttpError(401, 'Session expired or invalid. Please sign in again.'));
  }
}
