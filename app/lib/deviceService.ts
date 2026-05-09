// mobile/app/lib/authService.ts
// Mirrors web: src/services/authService.js

import { post, get, saveTokens, saveUser, clearTokens } from "./api";

export interface UserData {
  id: number;
  username: string;
  full_name: string;
}

export interface RegisterPayload {
  username: string;       // contact number used as username
  password: string;
  full_name: string;
  contact_number: string;
  province: string;
  municipality?: string;
  barangay?: string;
}

// POST /api/auth/register/
export const registerUser = async (payload: RegisterPayload) => {
  const result = await post("/auth/register/", payload);
  if (result.data?.access) {
    await saveTokens(result.data.access, result.data.refresh);
    if (result.data.user) await saveUser(result.data.user);
  }
  return result;
};

// POST /api/auth/login/
export const loginUser = async (username: string, password: string) => {
  const result = await post<{ access: string; refresh: string; user: UserData }>(
    "/auth/login/",
    { username, password }
  );
  if (result.data?.access) {
    await saveTokens(result.data.access, result.data.refresh);
    if (result.data.user) await saveUser(result.data.user);
  }
  return result;
};

// Clear all tokens (logout)
export const logoutUser = async () => {
  await clearTokens();
};

// GET /api/auth/user/
export const getCurrentUser = async () => {
  const result = await get<UserData>("/auth/user/");
  if (result.data && !result.error) await saveUser(result.data);
  return result;
};