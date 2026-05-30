/**
 * Centralized Supabase REST API fetch helper with automatic JWT refresh.
 *
 * All context files should import { supabaseFetch } from this module
 * instead of defining their own copy.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Prevent multiple simultaneous refresh attempts
let refreshPromise = null;

/**
 * Attempt to refresh an expired JWT using the stored refresh_token.
 * Returns the new access_token or null if refresh fails.
 */
async function tryRefreshToken() {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const session = localStorage.getItem('gu_auth_session');
    if (!session) return null;

    let parsed;
    try { parsed = JSON.parse(session); } catch { return null; }
    if (!parsed.refresh_token) return null;

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: parsed.refresh_token }),
      });

      if (!response.ok) {
        localStorage.removeItem('gu_auth_session');
        return null;
      }

      const result = await response.json();
      if (result.access_token) {
        const newSession = {
          access_token: result.access_token,
          refresh_token: result.refresh_token || parsed.refresh_token,
          user_id: result.user?.id || parsed.user_id,
        };
        localStorage.setItem('gu_auth_session', JSON.stringify(newSession));
        console.log('🔄 JWT token refreshed successfully');
        return result.access_token;
      }
      return null;
    } catch {
      localStorage.removeItem('gu_auth_session');
      return null;
    }
  })();

  try {
    const result = await refreshPromise;
    return result;
  } finally {
    refreshPromise = null;
  }
}

/** Get the current auth token from localStorage or fall back to anon key */
function getAuthToken() {
  const session = localStorage.getItem('gu_auth_session');
  if (session) {
    try { return JSON.parse(session).access_token || SUPABASE_ANON_KEY; } catch {}
  }
  return SUPABASE_ANON_KEY;
}

/**
 * Direct fetch to Supabase REST API with automatic JWT refresh on 401.
 *
 * @param {string} path  - Supabase REST path (e.g. 'events?select=*')
 * @param {object} options - { method, body, headers, prefer }
 */
export async function supabaseFetch(path, options = {}) {
  let token = getAuthToken();

  const doFetch = async (authToken) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Prefer': options.prefer || 'return=representation',
          ...options.headers,
        },
        method: options.method || 'GET',
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  // First attempt
  let response = await doFetch(token);

  // If 401 (JWT expired), try refreshing the token
  if (response.status === 401) {
    console.warn('⚠️ JWT expired, attempting token refresh...');
    const newToken = await tryRefreshToken();
    if (newToken) {
      response = await doFetch(newToken);
    } else {
      // No valid refresh — retry with anon key (works for public reads)
      console.warn('⚠️ Token refresh failed, falling back to anon key');
      response = await doFetch(SUPABASE_ANON_KEY);
    }
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.details || `HTTP ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
