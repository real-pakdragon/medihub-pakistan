// Chunked uploads: the browser sends a large file in small pieces so it can pass
// through proxies with a per-request body limit (Cloudflare Free caps at 100 MB).
//
// Pieces are collected in <filesDir>/.tmp/<uploadId>/ and joined only when the
// client says the file is complete. A final file is written to <filesDir>/library
// with exactly the same naming/path shape the single-request upload produced.
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

import { env } from '../config/env.js';
import { createHttpError } from '../lib/httpError.js';
import { MAX_FILE_SIZE, isAllowedMime, sanitizeName } from '../middleware/upload.js';

const MIN_CHUNK_SIZE = 1024 * 1024; // 1 MB
const MAX_CHUNK_SIZE = 32 * 1024 * 1024; // 32 MB
const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const tmpRoot = () => path.join(env.filesDir, '.tmp');
const libraryDir = () => path.join(env.filesDir, 'library');
const sessionDir = (uploadId) => path.join(tmpRoot(), uploadId);

function assertUploadId(uploadId) {
  if (!UUID_RE.test(String(uploadId ?? ''))) {
    throw createHttpError(400, 'Invalid upload session');
  }
}

async function readMeta(uploadId) {
  assertUploadId(uploadId);
  try {
    const raw = await readFile(path.join(sessionDir(uploadId), 'meta.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    throw createHttpError(404, 'Upload session not found or already finished');
  }
}

function expectedChunkSize(meta, index) {
  if (index === meta.totalChunks - 1) {
    return meta.fileSize - meta.chunkSize * (meta.totalChunks - 1);
  }
  return meta.chunkSize;
}

async function cleanupStaleUploads() {
  let entries = [];
  try {
    entries = await readdir(tmpRoot(), { withFileTypes: true });
  } catch {
    return;
  }

  const cutoff = Date.now() - STALE_AFTER_MS;
  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && UUID_RE.test(entry.name))
      .map(async (entry) => {
        const dir = path.join(tmpRoot(), entry.name);
        try {
          const meta = JSON.parse(await readFile(path.join(dir, 'meta.json'), 'utf8'));
          if (Number(meta.createdAt) > cutoff) return;
        } catch {
          // Unreadable session - remove it too.
        }
        await rm(dir, { recursive: true, force: true }).catch(() => {});
      })
  );
}

async function initUpload(body) {
  const originalName = String(body?.fileName ?? '').trim();
  const fileSize = Number(body?.fileSize);
  const chunkSize = Number(body?.chunkSize);
  const mimeType = String(body?.mimeType || 'application/octet-stream');

  if (!originalName) throw createHttpError(400, 'File name is required');
  if (!Number.isInteger(fileSize) || fileSize <= 0) {
    throw createHttpError(400, 'File size is missing or invalid');
  }
  if (fileSize > MAX_FILE_SIZE) {
    throw createHttpError(413, `File is larger than ${MAX_FILE_SIZE / (1024 * 1024 * 1024)} GB`);
  }
  if (!Number.isInteger(chunkSize) || chunkSize < MIN_CHUNK_SIZE || chunkSize > MAX_CHUNK_SIZE) {
    throw createHttpError(400, 'Invalid chunk size');
  }
  if (!isAllowedMime(mimeType)) {
    throw createHttpError(415, 'This file type is not allowed');
  }

  const uploadId = randomUUID();
  const totalChunks = Math.ceil(fileSize / chunkSize);
  const dir = sessionDir(uploadId);
  await mkdir(dir, { recursive: true });

  const meta = {
    uploadId,
    fileName: sanitizeName(path.basename(originalName)),
    originalName,
    fileSize,
    chunkSize,
    mimeType,
    totalChunks,
    createdAt: Date.now(),
  };
  await writeFile(path.join(dir, 'meta.json'), JSON.stringify(meta));

  void cleanupStaleUploads();
  return { uploadId, chunkSize, totalChunks };
}

async function saveChunk(uploadId, rawIndex, buffer) {
  const meta = await readMeta(uploadId);
  const index = Number(rawIndex);

  if (!Number.isInteger(index) || index < 0 || index >= meta.totalChunks) {
    throw createHttpError(400, 'Invalid chunk number');
  }
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw createHttpError(400, 'Empty chunk');
  }

  const expected = expectedChunkSize(meta, index);
  if (buffer.length !== expected) {
    throw createHttpError(
      400,
      `Chunk ${index} should be ${expected} bytes but received ${buffer.length}. The upload is out of sync.`
    );
  }

  await writeFile(path.join(sessionDir(uploadId), `${index}.part`), buffer);
  return { index, received: index + 1, totalChunks: meta.totalChunks };
}

async function completeUpload(uploadId) {
  const meta = await readMeta(uploadId);
  const dir = sessionDir(uploadId);

  const parts = [];
  for (let index = 0; index < meta.totalChunks; index += 1) {
    const part = path.join(dir, `${index}.part`);
    let info;
    try {
      info = await stat(part);
    } catch {
      throw createHttpError(400, `Upload is incomplete: piece ${index + 1} of ${meta.totalChunks} is missing`);
    }
    if (info.size !== expectedChunkSize(meta, index)) {
      throw createHttpError(400, `Upload is incomplete: piece ${index + 1} is damaged`);
    }
    parts.push(part);
  }

  await mkdir(libraryDir(), { recursive: true });
  const fileName = `${Date.now()}-${meta.fileName}`;
  const destination = path.join(libraryDir(), fileName);

  await writeFile(destination, Buffer.alloc(0));
  for (const part of parts) {
    await pipeline(createReadStream(part), createWriteStream(destination, { flags: 'a' }));
  }

  const info = await stat(destination);
  if (info.size !== meta.fileSize) {
    await rm(destination, { force: true }).catch(() => {});
    throw createHttpError(500, 'The assembled file is the wrong size. Please upload it again.');
  }

  await rm(dir, { recursive: true, force: true }).catch(() => {});

  return {
    fileName,
    filePath: `/files/library/${fileName}`,
    fileSize: info.size,
    originalName: meta.originalName,
  };
}

async function abortUpload(uploadId) {
  assertUploadId(uploadId);
  await rm(sessionDir(uploadId), { recursive: true, force: true }).catch(() => {});
  return { aborted: true };
}

export const uploadService = {
  initUpload,
  saveChunk,
  completeUpload,
  abortUpload,
  cleanupStaleUploads,
};
