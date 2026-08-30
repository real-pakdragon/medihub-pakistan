import { env } from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: `Route ${req.method} ${req.originalUrl} not found` } });
}

export function errorHandler(err, req, res, _next) {
  const status = err.status ?? 500;

  if (status >= 500) {
    console.error('[error]', err);
  }

  const body = {
    error: {
      message:
        status >= 500 && env.isProd
          ? 'Something went wrong on our end. Please try again later.'
          : err.message || 'Unexpected error',
      ...(err.details ? { details: err.details } : {}),
    },
  };

  if (!env.isProd && status >= 500 && err.stack) {
    body.error.stack = err.stack.split('\n').slice(0, 6).join('\n');
  }

  res.status(status).json(body);
}
