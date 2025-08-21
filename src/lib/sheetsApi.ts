import { APPS_SCRIPT_URL } from "@/config";

export type CandidateLite = {
  Name: string;
  Email: string;
  "Phone Number": string;
  "Job Role Admin": string;
  Datetime: string;
};

export type UpdateKey = { keyName: string; keyEmail: string };

type ApiResult = { success: boolean; message?: string; data?: any };

const ensureConfigured = () => {
  if (!APPS_SCRIPT_URL) {
    throw new Error(
      "Apps Script URL is not configured. Please set APPS_SCRIPT_URL in src/config.ts"
    );
  }
};

async function request<T = ApiResult>(body: Record<string, any>): Promise<T> {
  ensureConfigured();
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    // Intentionally omit Content-Type to avoid CORS preflight with Apps Script
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export async function createCandidate(data: CandidateLite) {
  return request({ action: "create", data });
}

export async function updateCandidate(key: UpdateKey, data: CandidateLite) {
  return request({ action: "update", key, data });
}

export async function deleteCandidate(key: UpdateKey) {
  return request({ action: "delete", key });
}
