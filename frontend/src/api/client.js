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

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => uploadRequest(path, formData),
};

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
