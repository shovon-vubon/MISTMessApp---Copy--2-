import { auth } from '../../firebase';
import { API_BASE } from '../config/api';

/**
 * POST to the backend with the current user's Firebase ID token attached.
 * Throws an Error with the server's message on non-2xx responses.
 *
 * @param {string} path  e.g. '/api/requests/abc123/approve'
 * @param {object} body  JSON body (optional)
 */
export async function apiPost(path, body = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in.');

  const token = await user.getIdToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // response had no JSON body
    }
    throw new Error(message);
  }

  return res.json();
}
