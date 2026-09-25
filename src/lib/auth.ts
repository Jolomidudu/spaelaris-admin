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
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
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
