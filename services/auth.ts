import Api from './api';

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  role?: 'ADMIN' | 'VENDOR' | 'PARTNER';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface GoogleAuthData {
  credential: string;
  role?: 'ADMIN' | 'VENDOR' | 'PARTNER';
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    vendorSlug?: string | null;
    partnerSlug?: string | null;
    verified: boolean;
    vendorSettings?: any;
    userTypePreference?: "VENDOR" | "AGENT" | null;
  };
  token: string;
  isNewUser?: boolean;
}

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await Api.post<{ data: AuthResponse }>('/auth/register', data);
  return response.data.data;
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await Api.post<{ data: AuthResponse }>('/auth/login', data);
  return response.data.data;
};

export const googleAuth = async (data: GoogleAuthData): Promise<AuthResponse> => {
  const response = await Api.post<{ data: AuthResponse }>('/auth/google', data);
  return response.data.data;
};

export const checkAuth = async (): Promise<{ user: any }> => {
  const response = await Api.get<{ data: { user: any } }>('/auth/check');
  return response.data.data;
};

export const setUserTypePreference = async (userTypePreference: "VENDOR" | "AGENT") => {
  const response = await Api.put<{ data: { user: any } }>('/auth/user-type-preference', {
    userTypePreference,
  });
  const data = response.data.data;
  // Let AdminLayout show a one-time "update your bio" prompt (same idea as the Agent/Marketer dialog).
  if (userTypePreference === 'AGENT' && data?.user?.id && typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('t360:agent-mode-on', { detail: { userId: data.user.id } })
      );
    } catch {
      // ignore
    }
  }
  return data;
};

/**
 * Send a 6-digit OTP to the user's email as the 2FA step during login.
 * Call this after the user submits valid credentials.
 */
export const sendLoginOtp = async (email: string): Promise<void> => {
  await Api.post('/auth/send-otp', { email });
};

/**
 * Verify the 6-digit OTP + re-supply the password, then receive a full auth token.
 */
export const verifyLoginOtp = async (
  email: string,
  otp: string,
  password: string
): Promise<AuthResponse> => {
  const response = await Api.post<{ data: AuthResponse }>('/auth/verify-otp', {
    email,
    otp,
    password,
  });
  return response.data.data;
};

// Browser window helper
interface BrowserWindow {
  localStorage?: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  };
}

const getBrowserWindow = (): BrowserWindow | null => {
  try {
    return ((globalThis as any).window as BrowserWindow | undefined) || null;
  } catch {
    return null;
  }
};

export const setToken = (token: string): void => {
  const win = getBrowserWindow();
  if (win?.localStorage) {
    // Clear any stale vendor-context keys from a previous session so the new
    // user's requests don't inherit the wrong x-selected-vendor header.
    win.localStorage.removeItem('selectedVendorId');
    win.localStorage.removeItem('t360:business:selectedBrandId');
    win.localStorage.setItem('token', token);
  }
};

export const setUser = (user: any): void => {
  const win = getBrowserWindow();
  if (win?.localStorage) {
    win.localStorage.setItem('user', JSON.stringify(user));
    try {
      // Let pages react immediately (same-tab). Storage events don't fire in same tab.
      (globalThis as any).window?.dispatchEvent?.(new Event('t360:userUpdated'));
    } catch {
      // ignore
    }
  }
};

export const getToken = (): string | null => {
  const win = getBrowserWindow();
  if (win?.localStorage) {
    return win.localStorage.getItem('token');
  }
  return null;
};

export const getCurrentUser = (): any | null => {
  const win = getBrowserWindow();
  if (win?.localStorage) {
    const userStr = win.localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

export const logout = (): void => {
  const win = getBrowserWindow();
  if (win?.localStorage) {
    win.localStorage.removeItem('token');
    win.localStorage.removeItem('user');
    win.localStorage.removeItem('selectedVendorId');
    win.localStorage.removeItem('t360:business:selectedBrandId');
  }
};

export default {
  register,
  login,
  googleAuth,
  checkAuth,
  setUserTypePreference,
  sendLoginOtp,
  verifyLoginOtp,
  setToken,
  setUser,
  getToken,
  getCurrentUser,
  logout,
};

