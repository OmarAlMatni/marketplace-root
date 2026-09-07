const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/**
 * Product images are stored as backend-relative paths (e.g. "/uploads/xyz.jpg").
 * This app runs on a different origin/port than the API, so paths need the
 * API's base URL prefixed to actually resolve.
 */
export function resolveImage(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_BASE}${path}`;
}
