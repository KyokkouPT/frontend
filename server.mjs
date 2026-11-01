import { createServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import next from "next";

/**
 * 自定义 Next server：
 * - /announce、/scrape 由本进程直接把原始 req.url 转给后端
 *   （Node 的 req.url 保留 percent-encoding，info_hash 不会被重新编码）；
 * - 其余请求交给 Next。
 *
 * 这样前端只需要一条 Nginx location / → 31002，Tracker 也走同一条路径。
 */
const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.FRONTEND_HOST ?? process.env.HOSTNAME ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 31002);
const backend = new URL(
  process.env.BACKEND_API_ORIGIN ?? process.env.API_ORIGIN ?? "http://127.0.0.1:31001",
);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

function isTracker(pathname) {
  return /^\/(announce|scrape)(\/|$)/.test(pathname);
}

function proxyTracker(req, res) {
  const requestFn = backend.protocol === "https:" ? httpsRequest : httpRequest;
  const upstream = requestFn(
    {
      hostname: backend.hostname,
      port: backend.port,
      path: req.url,
      method: "GET",
      headers: { ...req.headers, host: backend.host },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );

  upstream.on("error", () => {
    res.writeHead(502, { "content-type": "text/plain", "cache-control": "no-store" });
    res.end("tracker upstream unavailable");
  });

  req.pipe(upstream);
}

const server = createServer((req, res) => {
  if (isTracker(req.url ?? "")) {
    proxyTracker(req, res);
    return;
  }
  handle(req, res);
});

server.listen(port, hostname, () => {
  console.log(`> KyokkouPT frontend on http://${hostname}:${String(port)} (dev=${String(dev)})`);
});
