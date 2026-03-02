/**
 * Cross-tab auth event broadcasting.
 *
 * Uses BroadcastChannel (primary) + localStorage storage-event (fallback)
 * so that logging out in one tab instantly notifies every other open tab.
 */

const CHANNEL_NAME = 'ivy_auth';
const STORAGE_KEY = 'ivy_logout_event';

/**
 * Broadcast a logout event to all other same-origin tabs.
 * Call this from every logout path (logout page, useUserAuth hook, etc.).
 */
export function broadcastLogout(): void {
  if (typeof window === 'undefined') return;

  // Primary: BroadcastChannel (supported in all modern browsers)
  try {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    ch.postMessage({ type: 'logout' });
    ch.close();
  } catch {
    // BroadcastChannel not available – fall through to storage fallback
  }

  // Fallback: localStorage storage event (fires in *other* tabs)
  try {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  } catch {
    // Private browsing or storage full – best-effort
  }
}

/**
 * Dispatch a session-expired event on the current window.
 * Used by the API client when it receives a 401 so the hook in the
 * *same* tab can react (BroadcastChannel only reaches other tabs).
 */
export function dispatchSessionExpired(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ivy:session-expired'));
}

export { CHANNEL_NAME, STORAGE_KEY };
