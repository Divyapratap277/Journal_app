const TOKEN_KEY = "journal_token";

export function getApiUrl() {
  return (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function parseError(res: Response) {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${getApiUrl()}${path}`, { ...options, headers });
  if (res.status === 401) {
    setToken(null);
    if (!path.startsWith("/api/login")) {
      window.location.assign("/login");
    }
  }
  if (res.status === 204) {
    return undefined as T;
  }
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as T;
}
