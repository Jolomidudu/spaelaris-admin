export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

const AUTH_STORAGE_KEY = 'spaelaris_auth';
const AUTH_CHANGE_EVENT = 'spaelaris-auth-change';

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function subscribeToAuthChanges(onChange: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener('storage', onChange);
  window.addEventListener(AUTH_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(AUTH_CHANGE_EVENT, onChange);
  };
}

export function getStoredRoleSnapshot() {
  return normalizeRole(getStoredAuth()?.user.role) || 'OWNER';
}

export function getStoredAuth(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  notifyAuthChanged();
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  notifyAuthChanged();
}

export function getAccessToken() {
  return getStoredAuth()?.accessToken ?? null;
}

export function normalizeRole(role?: string | null): string {
  return String(role ?? '').trim().toUpperCase();
}

export function isRoleAllowed(
  role: string | null | undefined,
  allowedRoles: string[],
): boolean {
  const normalizedRole = normalizeRole(role);

  return allowedRoles.some(
    (allowedRole) => normalizeRole(allowedRole) === normalizedRole,
  );
}
