const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function getStoredToken() {
  try {
    return localStorage.getItem('medihub_admin_token');
  } catch {
    return null;
  }
}

function isAdminAuthFailure(path, status) {
  return status === 401 && !path.startsWith('/admin/login') && Boolean(getStoredToken());
}

export function setStoredToken(token) {
  if (token) localStorage.setItem('medihub_admin_token', token);
  else localStorage.removeItem('medihub_admin_token');
}

function redirectToAdminLogin() {
  setStoredToken(null);
  if (typeof window !== 'undefined') window.location.assign('/admin/login');
}

async function request(path, { method = 'GET', body } = {}) {
  const token = getStoredToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    if (isAdminAuthFailure(path, res.status)) redirectToAdminLogin();
    const message = payload?.error?.message ?? `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, payload?.error?.details);
  }

  return payload;
}

// Cloudflare Free rejects requests over 100 MB, so anything bigger is uploaded
// in 20 MB pieces. Kept well below the limit to leave room for retries.
const UPLOAD_CHUNK_SIZE = 20 * 1024 * 1024;
const DIRECT_UPLOAD_LIMIT = 90 * 1024 * 1024;

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => uploadRequest(path, formData),
  // Upload a File object, switching to chunked upload for large files.
  // `base` is the admin section root, e.g. /admin/library.
  uploadFile: (base, file, onProgress) =>
    file.size > DIRECT_UPLOAD_LIMIT
      ? chunkedUpload(base, file, onProgress)
      : uploadRequest(`${base}/upload`, fileFormData(file)),
};

function fileFormData(file) {
  const fd = new FormData();
  fd.append('file', file);
  return fd;
}

async function chunkedUpload(base, file, onProgress) {
  const init = await request(`${base}/uploads`, {
    method: 'POST',
    body: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      chunkSize: UPLOAD_CHUNK_SIZE,
    },
  });

  const { uploadId, totalChunks } = init.data;

  try {
    for (let index = 0; index < totalChunks; index += 1) {
      const start = index * UPLOAD_CHUNK_SIZE;
      const piece = file.slice(start, Math.min(start + UPLOAD_CHUNK_SIZE, file.size));
      await uploadChunkWithRetry(`${base}/uploads/${uploadId}/chunks/${index}`, piece);
      onProgress?.(Math.round(((index + 1) / totalChunks) * 100));
    }

    return await request(`${base}/uploads/${uploadId}/complete`, { method: 'POST' });
  } catch (err) {
    try {
      await request(`${base}/uploads/${uploadId}`, { method: 'DELETE' });
    } catch {
      // Best effort: the server also clears abandoned uploads after 24 hours.
    }
    throw err;
  }
}

async function uploadChunkWithRetry(path, piece, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await uploadChunk(path, piece);
    } catch (err) {
      lastError = err;
      const retriable = !(err instanceof ApiError) || err.status >= 500 || err.status === 429;
      if (!retriable || attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw lastError;
}

async function uploadChunk(path, piece) {
  const token = getStoredToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: piece,
  });

  const text = await res.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    if (isAdminAuthFailure(path, res.status)) redirectToAdminLogin();
    throw new ApiError(
      payload?.error?.message ?? `Upload failed with status ${res.status}`,
      res.status,
      payload?.error?.details
    );
  }

  return payload;
}

async function uploadRequest(path, formData) {
  const token = getStoredToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const text = await res.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    if (isAdminAuthFailure(path, res.status)) redirectToAdminLogin();
    const message = payload?.error?.message ?? `Upload failed with status ${res.status}`;
    throw new ApiError(message, res.status, payload?.error?.details);
  }
  return payload;
}
