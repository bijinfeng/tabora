import { createServer } from "node:http"
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
