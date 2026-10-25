import { problem } from "@kyokkou/contracts";

/**
 * 浏览器侧 API 客户端：
 * - 同源 /api（本地由 next.config rewrites 转发到后端）；
 * - 带 Cookie（credentials: include），不缓存；
 * - 写请求自动带 x-csrf-token（double-submit）。
 */

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: { path: string; message: string }[];

  constructor(
    message: string,
    status: number,
    code: string,
    fields?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    if (fields && fields.length > 0) this.fields = fields;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

async function toApiError(response: Response): Promise<ApiClientError> {
  try {
    const parsed = problem.safeParse(await response.json());
    if (parsed.success) {
      return new ApiClientError(parsed.data.title, response.status, parsed.data.code, parsed.data.fields);
    }
  } catch {
    /* 非 problem+json */
  }
  return new ApiClientError(`HTTP ${String(response.status)}`, response.status, "http_error");
}

/** 没有 kp_csrf Cookie 时先请求 /auth/csrf。 */
export async function ensureCsrf(): Promise<string> {
  const existing = readCookie("kp_csrf");
  if (existing) return existing;

  const response = await fetch("/api/v1/auth/csrf", {
    credentials: "include",
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw await toApiError(response);

  const data = (await response.json()) as { csrf_token: string };
  return data.csrf_token;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");

  const method = (init.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    headers.set("x-csrf-token", await ensureCsrf());
    if (init.body !== undefined && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options: { idempotencyKey?: string } = {},
): Promise<T> {
  const csrf = await ensureCsrf();
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-csrf-token": csrf,
  };
  if (options.idempotencyKey) headers["idempotency-key"] = options.idempotencyKey;
  return apiFetch<T>(path, {
    method: "POST",
    headers,
    body: body === undefined ? "{}" : JSON.stringify(body),
  });
}

/** multipart 上传：不手动设置 content-type，交给浏览器生成 boundary。 */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const csrf = await ensureCsrf();
  const response = await fetch(path, {
    method: "POST",
    body: form,
    credentials: "include",
    cache: "no-store",
    headers: {
      accept: "application/json",
      "x-csrf-token": csrf,
    },
  });

  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as T;
}
