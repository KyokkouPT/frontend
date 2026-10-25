import { problem } from "@kyokkou/contracts";
import { cookies } from "next/headers";

/**
 * 服务端组件（RSC）访问后端的唯一入口。
 *
 * - 默认走 BACKEND_API_ORIGIN（回退 API_ORIGIN），不做同源 rewrite；
 * - 转发浏览器 Cookie；
 * - 只有设置 BACKEND_SECRET 时才发 X-Kyou-Secret（生产由 Nginx 校验）；
 * - cache: no-store，失败抛 ServerFetchError，由页面决定空态/错误态；
 * - 不要在客户端组件里引用本文件。
 */
const BACKEND_ORIGIN =
  process.env.BACKEND_API_ORIGIN ?? process.env.API_ORIGIN ?? "http://127.0.0.1:31001";

const BACKEND_SECRET = process.env.BACKEND_SECRET;

export class ServerFetchError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "ServerFetchError";
    this.status = status;
    this.code = code;
  }
}

export async function serverFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieHeader = (await cookies()).toString();
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  if (cookieHeader) headers.set("cookie", cookieHeader);
  if (BACKEND_SECRET) headers.set("x-kyou-secret", BACKEND_SECRET);

  const response = await fetch(`${BACKEND_ORIGIN}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let code = "http_error";
    let title = `HTTP ${response.status}`;

    try {
      const parsed = problem.safeParse(await response.json());
      if (parsed.success) {
        code = parsed.data.code;
        title = parsed.data.title;
      }
    } catch {
      /* 非 problem+json 响应，保留 HTTP 状态描述 */
    }

    throw new ServerFetchError(title, response.status, code);
  }

  return (await response.json()) as T;
}
