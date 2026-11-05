import multer from 'multer';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { env } from '../config/env.js';

export const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB — large PDFs/atlases

export const sanitizeName = (original) => {
  const base = path.basename(original ?? 'file').replace(/\s+/g, '-');
  const clean = base.replace(/[^a-zA-Z0-9._-]/g, '').replace(/-{2,}/g, '-');
  return (clean || 'file').trim();
};

export const isAllowedMime = (mimetype) => {
  const type = mimetype || 'application/octet-stream';
  return (
    type === 'application/pdf' ||
    type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    type === 'application/vnd.ms-powerpoint' ||
    type === 'application/msword' ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type.startsWith('image/') ||
    type === 'video/mp4' ||
    type === 'application/zip' ||
    type === 'application/octet-stream'
  );
};

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    const dir = path.join(env.filesDir, 'library');
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, _file, cb) {
    const original = sanitizeName(path.basename(req.body?.fileName || _originalName(_file)));
    const stamp = `${Date.now()}`;
    cb(null, `${stamp}-${original}`);
  },
});

function _originalName(file) {
  return file?.originalname ?? 'file';
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter(_req, file, cb) {
    cb(null, isAllowedMime(file.mimetype));
  },
});

export const uploadSingle = (field = 'file') => (req, res, next) => {
  upload.single(field)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ error: { message: `Upload failed: ${err.message}` } });
    }
    if (err) return res.status(400).json({ error: { message: err.message } });
    next();
  });
};