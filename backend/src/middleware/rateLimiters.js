import rateLimit from 'express-rate-limit';

const limiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { message } },
  });

export const contactLimiter = limiter(
  15 * 60 * 1000,
  5,
  'Too many messages from this IP. Please try again in a few minutes.'
);

export const subscribeLimiter = limiter(
  60 * 60 * 1000,
  8,
  'Too many subscription attempts from this IP. Please try again later.'
);

export const loginLimiter = limiter(
  15 * 60 * 1000,
  10,
  'Too many login attempts. Please try again in 15 minutes.'
);

export const readLimiter = limiter(60 * 1000, 240, 'Too many requests. Slow down a little.');
