import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';

import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    })
  );

  app.use(express.json({ limit: '200kb' }));

  const filesDir = env.filesDir;
  if (filesDir) {
    app.use(
      '/files',
      express.static(filesDir, {
        maxAge: '30d',
        immutable: true,
        setHeaders(res, filePath) {
          if (filePath.endsWith('.pdf')) res.setHeader('Content-Type', 'application/pdf');
        },
      })
    );
  }

  app.use('/api', routes);

  app.get('/', (_req, res) => {
    res.json({ name: 'MediHub Pakistan API', status: 'ok', docs: '/api/health' });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
