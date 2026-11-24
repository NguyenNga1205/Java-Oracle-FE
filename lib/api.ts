export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const KEY = "qlsv_auth";

export type Item = Record<string, any>;

export const authToken = () =>
  typeof window === "undefined" ? "" : sessionStorage.getItem(KEY) || "";
export const setAuthToken = (user: string, pass: string) =>
  sessionStorage.setItem(KEY, btoa(unescape(encodeURIComponent(user + ":" + pass))));
export const clearAuthToken = () => sessionStorage.removeItem(KEY);

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      Authorization: "Basic " + authToken(),
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    let detail = "";
    try {
      const obj = JSON.parse(body);
      detail = obj.detail || obj.message || obj.error || "";
    } catch {
      detail = body.slice(0, 180);
    }
    if (!detail && res.status === 403)
      throw new Error("Máy chủ từ chối thao tác này (HTTP 403). Bạn có thể không đủ quyền, hoặc backend chưa được cập nhật bản mới nhất.");
    throw new Error(detail || `Yêu cầu thất bại (HTTP ${res.status}).`);
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

export async function upload<T = any>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(API + path, {
    method: "POST",
    headers: { Authorization: "Basic " + authToken() },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || body.detail || "Không thể xử lý file.");
  return body as T;
}

export async function downloadFile(path: string, filename: string) {
  const res = await fetch(API + path, { headers: { Authorization: "Basic " + authToken() } });
  if (!res.ok) throw new Error("Không tải được file.");
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
