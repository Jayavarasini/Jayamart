// Thin fetch wrapper for the JayaMart REST API.
// In development this stays relative ('/api' via the Vite proxy); in cloud
// deployments VITE_API_URL can point at the remote backend's /api base.
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function getToken() {
  return localStorage.getItem('jm_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('jm_token', token);
  else localStorage.removeItem('jm_token');
}

/**
 * Perform an API request.
 * @returns {Promise<any>} parsed JSON response
 * @throws {Error} with .status and .data for non-2xx responses
 */
export async function api(path, options = {}) {
  const { method = 'GET', body } = options;

  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the JayaMart server. Is the backend running?');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
