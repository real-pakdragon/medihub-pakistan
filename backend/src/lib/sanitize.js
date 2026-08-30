const HTML_TAGS = /<\/?[^>]*>/g;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

export function sanitizeText(value) {
  return value.replace(HTML_TAGS, '').replace(CONTROL_CHARS, ' ').trim();
}

export function sanitizeEmail(value) {
  return value.trim().toLowerCase();
}

export const asArrayOfLinks = (links) =>
  links.map(({ label, url, type }) => ({ label, url: url.trim(), type }));
