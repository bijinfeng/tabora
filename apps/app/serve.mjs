import { createServer } from "node:http"
import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import { dirname, extname, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"

import handler from "./dist/server/server.js"

/**
 * 生产运行入口：vite-plus 构建产出 dist/server/server.js 为 fetch handler 模块，
 * 自身不监听端口。这里用 node:http 把 Node 请求/响应桥接到 fetch 接口，并读取 HOST/PORT。
 * 服务端运行时（迁移建表、better-auth、邮件队列）在首个请求命中时由 getRuntime() 惰性初始化。
 */
const host = process.env.HOST ?? "127.0.0.1"
const port = Number(process.env.PORT ?? 4000)
const appDirectory = dirname(fileURLToPath(import.meta.url))
const backendClientDirectory = resolve(appDirectory, "dist/client")
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".woff2": "font/woff2",
}

async function sendStaticFile(req, res, filePath, cacheControl) {
  let file
  try {
    file = await stat(filePath)
  } catch {
    return false
  }
  if (!file.isFile()) return false

  res.writeHead(200, {
    "cache-control": cacheControl,
    "content-length": file.size,
    "content-type": contentTypes[extname(filePath)] ?? "application/octet-stream",
  })
  if (req.method === "HEAD") {
    res.end()
    return true
  }
  await pipeline(createReadStream(filePath), res)
  return true
}

async function serveBackendClient(req, res) {
  if ((req.method !== "GET" && req.method !== "HEAD") || !req.url) return false

  const pathname = new URL(req.url, "http://localhost").pathname
  if (pathname !== "/favicon.svg" && !pathname.startsWith("/assets/")) return false

  let filePath
  try {
    filePath = resolve(backendClientDirectory, `.${decodeURIComponent(pathname)}`)
  } catch {
    return false
  }
  if (relative(backendClientDirectory, filePath).startsWith("..")) return false
  return sendStaticFile(req, res, filePath, "public, max-age=31536000, immutable")
}

function toRequest(req, signal) {
  const protocol = req.headers["x-forwarded-proto"] ?? "http"
  const url = new URL(req.url, `${protocol}://${req.headers.host ?? `${host}:${port}`}`)

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue
    if (Array.isArray(value)) for (const item of value) headers.append(key, item)
    else headers.append(key, value)
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD"
  return new Request(url, {
    method: req.method,
    headers,
    signal,
    ...(hasBody ? { body: Readable.toWeb(req), duplex: "half" } : {}),
  })
}

async function writeResponse(response, res) {
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") continue
    res.setHeader(key, value)
  }
  // better-auth 会下发多个 Set-Cookie，必须逐条写出，不能被合并成单个逗号分隔值
  const cookies = response.headers.getSetCookie()
  if (cookies.length > 0) res.setHeader("set-cookie", cookies)

  res.writeHead(response.status, response.statusText)
  if (!response.body) {
    res.end()
    return
  }
  await pipeline(Readable.fromWeb(response.body), res)
}

const server = createServer((req, res) => {
  const controller = new AbortController()
  res.on("close", () => controller.abort())

  void (async () => {
    try {
      if (await serveBackendClient(req, res)) return
      await writeResponse(await handler.fetch(toRequest(req, controller.signal)), res)
    } catch (err) {
      console.error("请求处理失败", err)
      if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain; charset=utf-8" })
      res.end("Internal Server Error")
    }
  })()
})

server.listen(port, host, () => {
  console.warn(`Tabora app listening on http://${host}:${port}`)
})
