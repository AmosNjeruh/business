import axios, { AxiosInstance } from 'axios';

// Get base URL from environment or use default (reuse frontend pattern)
const getBaseURL = (): string => {
  const envURL = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (envURL && (envURL.startsWith('http://') || envURL.startsWith('https://'))) {
    return envURL;
  }

  return 'http://localhost:9000/api';
};

const baseURL = getBaseURL();

// Minimal browser window typing for localStorage
interface BrowserWindow {
  localStorage?: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  };
}

const Api: AxiosInstance = axios.create({
  baseURL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token and vendor context from localStorage to every request
Api.interceptors.request.use(
  (config: import('axios').InternalAxiosRequestConfig) => {
    try {
      const win = (globalThis as any).window as BrowserWindow | undefined;
      if (win?.localStorage) {
        const token = win.localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Align with frontend vendor app: pass selected vendor for RBAC.
        // In Business Suite, "brand" selection maps to vendor-context on the API.
        // Prefer the business brand storage key, but fall back to the shared vendor key.
        // Don't send header if explicitly disabled (e.g., when fetching brands list)
        if (!(config.headers as any)['x-selected-vendor-disabled']) {
          const selectedBrandId = win.localStorage.getItem('t360:business:selectedBrandId');
          const selectedVendorId = win.localStorage.getItem('selectedVendorId');
          const contextId = selectedBrandId || selectedVendorId;
          
          // Only set header if we have a valid context ID
          // The backend will default to authenticated user's own ID if header is missing
          if (contextId && contextId.trim() !== '') {
            (config.headers as any)['x-selected-vendor'] = contextId;
          }
        }
      }
    } catch {
      // ignore if not in browser
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

export default Api;

