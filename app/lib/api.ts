// mobile/app/lib/api.ts
// Mirrors web: src/services/api.js
// Replaces: mobile/app/lib/supabase.ts

import * as SecureStore from "expo-secure-store";

const BASE_URL = "http://192.168.100.19:8000/api"; // ← change to your Django server IP

// ─── Token helpers ───────────────────────────────────────────────
export const getAccessToken = async () =>
  await SecureStore.getItemAsync("access_token");

export const getRefreshToken = async () =>
  await SecureStore.getItemAsync("refresh_token");

export const saveTokens = async (access: string, refresh?: string | null) => {
  await SecureStore.setItemAsync("access_token", access);
  if (refresh) await SecureStore.setItemAsync("refresh_token", refresh);
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync("access_token");
  await SecureStore.deleteItemAsync("refresh_token");
  await SecureStore.deleteItemAsync("user");
};

export const saveUser = async (user: object) =>
  await SecureStore.setItemAsync("user", JSON.stringify(user));

export const getStoredUser = async () => {
  const raw = await SecureStore.getItemAsync("user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

// ─── Token refresh ───────────────────────────────────────────────
export const refreshAccessToken = async (): Promise<string | null> => {
  const refresh = await getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    await saveTokens(data.access);
    return data.access;
  } catch {
    return null;
  }
};

// ─── Core request ────────────────────────────────────────────────
type ApiResult<T = any> = { data: T | null; error: string | null; status: number };

export const request = async <T = any>(
  method: string,
  endpoint: string,
  body: object | null = null,
  retry = true
): Promise<ApiResult<T>> => {
  const token = await getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options: RequestInit = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, options);

    // Auto-refresh on 401
    if (res.status === 401 && retry) {
      const newToken = await refreshAccessToken();
      if (newToken) return request(method, endpoint, body, false);
      await clearTokens();
      return { data: null, error: "Session expired. Please log in again.", status: 401 };
    }

    let data: T | null = null;
    const ct = res.headers.get("content-type");
    if (ct && ct.includes("application/json")) data = await res.json() as T;

    if (!res.ok) {
      const anyData = data as any;
      const errorMsg =
        anyData?.detail ||
        anyData?.non_field_errors?.[0] ||
        (Object.values(anyData || {}) as any [])?.[0]?.[0] ||
        `Error ${res.status}`;
      return { data: null, error: String(errorMsg), status: res.status };
    }

    return { data, error: null, status: res.status };
  } catch (e: any) {
    return { data: null, error: "Network error — is the Django server running?", status: 0 };
  }
};

// ─── Convenience methods ─────────────────────────────────────────
export const get  = <T = any>(ep: string)              => request<T>("GET",    ep);
export const post = <T = any>(ep: string, body: object) => request<T>("POST",   ep, body);
export const patch= <T = any>(ep: string, body: object) => request<T>("PATCH",  ep, body);
export const del  = <T = any>(ep: string)              => request<T>("DELETE", ep);

// Unwrap paginated Django responses (results array)
export const unwrapList = <T = any>(result: ApiResult<any>): ApiResult<T[]> => {
  if (result.data?.results) return { ...result, data: result.data.results };
  return result as ApiResult<T[]>;
};