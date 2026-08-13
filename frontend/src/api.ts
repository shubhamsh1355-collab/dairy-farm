import AsyncStorage from "@react-native-async-storage/async-storage";

const API = process.env.EXPO_PUBLIC_BACKEND_URL;
const TOKEN_KEY = "kd_token";
const FARM_KEY = "kd_farm";

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function saveSession(token: string, farm: any) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(FARM_KEY, JSON.stringify(farm));
}

export async function loadFarm(): Promise<any | null> {
  const raw = await AsyncStorage.getItem(FARM_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearSession() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(FARM_KEY);
}

export async function hasSession(): Promise<boolean> {
  return !!(await getToken());
}

async function request<T = any>(
  path: string,
  opts: { method?: string; body?: any; auth?: boolean } = {}
): Promise<T> {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = { 
    "Content-Type": "application/json",
    "Bypass-Tunnel-Reminder": "true",
    "ngrok-skip-browser-warning": "true"
  };
  if (auth) {
    const t = await getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  
  if (text.trim().startsWith("<")) {
    throw new Error(
      "Connection intercepted! Please open the backend URL in your browser and click 'Click to Continue' to bypass the security warning: " + API
    );
  }

  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = data?.detail || data?.message || `Request failed (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data as T;
}

export const api = {
  sendOtp: (mobile: string) =>
    request<{ sent: boolean; otp: string }>("/auth/send-otp", {
      method: "POST",
      body: { mobile },
      auth: false,
    }),
  verifyOtp: (payload: {
    mobile: string;
    code: string;
    farm_name?: string;
    owner_name?: string;
  }) =>
    request<{
      needs_registration?: boolean;
      is_new?: boolean;
      token?: string;
      farm?: any;
    }>("/auth/verify-otp", { method: "POST", body: payload, auth: false }),
  me: () => request<{ farm: any }>("/farm/me"),
  updateSettings: (payload: { upi_id?: string; farm_name?: string }) =>
    request<{ farm: any }>("/farm/settings", { method: "PUT", body: payload }),

  todayMilk: () => request<{ log: any; logs: any[]; expected: any }>("/milk/today"),
  logMilk: (payload: any) => request<{ log: any }>("/milk/log", { method: "POST", body: payload }),
  milkLogs: (month?: string) =>
    request<{ logs: any[] }>(`/milk/logs${month ? `?month=${month}` : ""}`),

  products: () => request<{ products: any[] }>("/products"),
  createProduct: (payload: any) => request("/products", { method: "POST", body: payload }),
  adjustStock: (id: string, delta: number, note = "") =>
    request(`/products/${id}/stock`, { method: "PATCH", body: { delta, note } }),
  sellProduct: (id: string, qty: number, price?: number, contact_id?: string) =>
    request(`/products/${id}/sale`, {
      method: "POST",
      body: { qty, price_per_unit: price, contact_id },
    }),
  deleteProduct: (id: string) => request(`/products/${id}`, { method: "DELETE" }),

  analytics: (month?: string) =>
    request<any>(`/analytics/monthly${month ? `?month=${month}` : ""}`),

  contacts: () => request<{ contacts: any[] }>("/contacts"),
  addContact: (payload: { name: string; mobile: string; cow_req_ltr?: number; buffalo_req_ltr?: number; cow_rate?: number; buffalo_rate?: number }) =>
    request("/contacts", { method: "POST", body: payload }),
  updateContact: (id: string, payload: any) =>
    request(`/contacts/${id}`, { method: "PUT", body: payload }),
  deleteContact: (id: string) => request(`/contacts/${id}`, { method: "DELETE" }),
  
  addSkip: (id: string, date: string, qty_skipped: number, milk_type: string = "cow") =>
    request(`/contacts/${id}/skips`, { method: "POST", body: { date, qty_skipped, milk_type } }),
  getSkips: (id: string, month: string) => request<{ skips: any[] }>(`/contacts/${id}/skips?month=${month}`),
  generateBill: (id: string, month: string) => request<any>(`/contacts/${id}/bill?month=${month}`),

  cows: () => request<{ cows: any[] }>("/cows"),
  addCow: (payload: { tag: string; breed?: string; status?: string }) => request("/cows", { method: "POST", body: payload }),
  updateCowStatus: (id: string, status: string) => request(`/cows/${id}/status`, { method: "PATCH", body: { status } }),
  addCowEvent: (id: string, payload: { type: string; date: string; notes: string }) => request(`/cows/${id}/events`, { method: "POST", body: payload }),
  cowEvents: (id: string) => request<{ events: any[] }>(`/cows/${id}/events`),

  sendBroadcast: (message: string, contact_ids: string[]) =>
    request<{ broadcast: any }>("/broadcast", {
      method: "POST",
      body: { message, contact_ids },
    }),
  broadcasts: () => request<{ broadcasts: any[] }>("/broadcasts"),
};
