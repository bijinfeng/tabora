import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createServer, type ViteDevServer } from "vite"
import tailwindcss from "@tailwindcss/vite"
import solid from "vite-plugin-solid"
import { existsSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import http from "node:http"
import net from "node:net"
import crypto from "node:crypto"

type DevtoolsPage = {
  url?: string
  webSocketDebuggerUrl?: string
}

type WorkbenchSnapshot = {
  rail: boolean
  topbar: boolean
  grid: boolean
  cardTitles: string[]
  overflowX: boolean
}

type VerifyResult = {
  initial: WorkbenchSnapshot
  addBefore: number
  addFocus: string
  addAfter: number
  todoSizeOptions: string[]
  notesModalOpen: boolean
  mobileOverflowX: boolean
  dragOrder: {
    before: string[]
    after: string[]
  }
}

const chromePath = findChromePath()
let server: ViteDevServer | undefined
let chrome: ChildProcessWithoutNullStreams | undefined
let chromeProfile = ""
let devServerUrl = ""

const runIfChrome = chromePath ? it : it.skip

beforeAll(async () => {
  if (!chromePath) return

  server = await createServer({
    root: join(process.cwd(), "apps/playground"),
    configFile: false,
    logLevel: "silent",
    server: {
      host: "127.0.0.1",
      port: 0,
    },
    plugins: [solid(), tailwindcss()],
  })
  await server.listen()
  const address = server.httpServer?.address()
  if (!address || typeof address === "string") {
    throw new Error("Vite server did not expose a local port")
  }
  devServerUrl = `http://127.0.0.1:${address.port}`

  chromeProfile = await mkdtemp(join(tmpdir(), "tabora-playground-e2e-"))
  chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--remote-debugging-address=127.0.0.1",
      "--remote-debugging-port=9223",
      `--user-data-dir=${chromeProfile}`,
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      devServerUrl,
    ],
    { stdio: "pipe" },
  )
})

afterAll(async () => {
  if (chrome) {
    chrome.kill()
    await waitForExit(chrome)
  }
  await server?.close()
  if (chromeProfile) {
    await rm(chromeProfile, { force: true, maxRetries: 3, recursive: true, retryDelay: 250 })
  }
})

describe("workbench dashboard layout", () => {
  runIfChrome(
    "renders the plugin-provided dashboard shell and supports core widget interactions",
    async () => {
      const page = await connectToDevtoolsPage(devServerUrl)
      const client = await CdpClient.connect(page.webSocketDebuggerUrl!)

      try {
        const result = await verifyWorkbenchDashboard(client, devServerUrl)

        expect(result.initial).toMatchObject({
          rail: true,
          topbar: true,
          grid: true,
          overflowX: false,
        })
        expect(result.initial.cardTitles).toEqual(["今日重点", "快捷入口", "便签", "待办"])
        expect(result.addAfter).toBe(result.addBefore + 1)
        expect(result.addFocus).toBe("add-widgets")
        expect(result.todoSizeOptions).toEqual(["S", "M", "L", "XL"])
        expect(result.notesModalOpen).toBe(true)
        expect(result.mobileOverflowX).toBe(false)
        expect(result.dragOrder.after).toEqual([
          result.dragOrder.before[1],
          result.dragOrder.before[0],
          ...result.dragOrder.before.slice(2),
        ])
      } finally {
        client.close()
      }
    },
    45_000,
  )
})

async function verifyWorkbenchDashboard(client: CdpClient, baseUrl: string): Promise<VerifyResult> {
  await client.send("Runtime.enable")
  await client.send("Page.enable")
  await client.send("Emulation.setDeviceMetricsOverride", {
    deviceScaleFactor: 1,
    height: 900,
    mobile: false,
    width: 1280,
  })
  await client.send("Page.navigate", { url: baseUrl })
  await wait(2_000)
  await client.evaluate(`new Promise((resolve) => {
    localStorage.clear()
    const request = indexedDB.deleteDatabase("tabora")
    request.onsuccess = () => resolve(true)
    request.onerror = () => resolve(false)
    request.onblocked = () => resolve(false)
  })`)
  await client.send("Page.navigate", { url: `${baseUrl}?fresh=${Date.now()}` })
  await wait(2_500)

  const initial = await client.evaluate<WorkbenchSnapshot>(`(() => {
    return {
      rail: !!document.querySelector(".workbench-rail"),
      topbar: !!document.querySelector(".topbar .search-bar"),
      grid: !!document.querySelector(".workbench-grid"),
      cardTitles: [...document.querySelectorAll(".widget-header h2")].map((node) =>
        node.textContent.trim(),
      ),
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }
  })()`)
  const addBefore = await client.evaluate<number>(`document.querySelectorAll(".grid-item").length`)
  await client.evaluate(
    `document.querySelector('.workbench-rail button[aria-label="添加卡片"]').click()`,
  )
  const addFocus = await client.evaluate<string>(`document.activeElement?.id`)
  await client.evaluate(`document.querySelector(".add-widget-btn").click()`)
  await wait(500)
  const addAfter = await client.evaluate<number>(`document.querySelectorAll(".grid-item").length`)
  const todoSizeOptions = await client.evaluate<string[]>(`(() => {
    const todo = [...document.querySelectorAll(".grid-item")].find((node) =>
      node.textContent.includes("待办"),
    )
    return [...todo.querySelectorAll(".size-select option")].map((option) => option.value)
  })()`)
  await client.evaluate(`(() => {
    const notes = [...document.querySelectorAll(".grid-item")].find((node) =>
      node.textContent.includes("便签"),
    )
    notes.querySelector(".widget-expand-btn").click()
  })()`)
  await wait(500)
  const notesModalOpen = await client.evaluate<boolean>(
    `!!document.querySelector(".modal-overlay .notes-modal")`,
  )
  await client.evaluate(`document.querySelector(".modal-close").click()`)
  await wait(250)

  const dragOrder = await client.evaluate<{ before: string[]; after: string[] }>(`(() => {
    const items = [...document.querySelectorAll(".grid-item")]
    const before = items.map((item) => item.getAttribute("aria-label"))
    const source = items[0]
    const target = items[1]
    const data = new DataTransfer()
    source.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent("dragover", {
      bubbles: true,
      cancelable: true,
      dataTransfer: data,
    }))
    target.dispatchEvent(new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      dataTransfer: data,
    }))
    return new Promise((resolve) => setTimeout(() => {
      resolve({
        before,
        after: [...document.querySelectorAll(".grid-item")].map((item) =>
          item.getAttribute("aria-label"),
        ),
      })
    }, 600))
  })()`)

  await client.send("Emulation.setDeviceMetricsOverride", {
    deviceScaleFactor: 1,
    height: 844,
    mobile: true,
    width: 390,
  })
  await wait(500)
  const mobileOverflowX = await client.evaluate<boolean>(
    `document.documentElement.scrollWidth > document.documentElement.clientWidth`,
  )

  return {
    addAfter,
    addBefore,
    addFocus,
    dragOrder,
    initial,
    mobileOverflowX,
    notesModalOpen,
    todoSizeOptions,
  }
}

async function connectToDevtoolsPage(baseUrl: string): Promise<DevtoolsPage> {
  const pages = await waitForJson<DevtoolsPage[]>("http://127.0.0.1:9223/json")
  const page = pages.find((item) => item.url?.startsWith(baseUrl)) ?? pages[0]
  if (!page?.webSocketDebuggerUrl) {
    throw new Error("Chrome did not expose a debuggable page")
  }
  return page
}

function findChromePath(): string | undefined {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ]
  return candidates.find((path) => {
    return existsSync(path)
  })
}

function getJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    http
      .get(url, (response) => {
        let data = ""
        response.on("data", (chunk) => {
          data += chunk
        })
        response.on("end", () => {
          try {
            resolve(JSON.parse(data) as T)
          } catch (error) {
            reject(error)
          }
        })
      })
      .on("error", reject)
  })
}

async function waitForJson<T>(url: string): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      return await getJson<T>(url)
    } catch (error) {
      lastError = error
      await wait(500)
    }
  }
  throw lastError
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForExit(process: ChildProcessWithoutNullStreams): Promise<void> {
  return new Promise((resolve) => {
    if (process.exitCode !== null || process.killed) {
      setTimeout(resolve, 500)
      return
    }
    process.once("exit", () => resolve())
    setTimeout(resolve, 2_000)
  })
}

class CdpClient {
  private nextId = 0
  private readonly pending = new Map<
    number,
    { reject: (error: Error) => void; resolve: (value: any) => void }
  >()

  private constructor(private readonly socket: RawWebSocket) {
    this.socket.onMessage((text) => {
      const message = JSON.parse(text)
      if (!message.id || !this.pending.has(message.id)) return
      const request = this.pending.get(message.id)!
      this.pending.delete(message.id)
      if (message.error) {
        request.reject(new Error(JSON.stringify(message.error)))
        return
      }
      request.resolve(message.result)
    })
  }

  static async connect(url: string): Promise<CdpClient> {
    const socket = new RawWebSocket(url)
    await socket.connect()
    return new CdpClient(socket)
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<any> {
    const id = ++this.nextId
    this.socket.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => {
      this.pending.set(id, { reject, resolve })
    })
  }

  async evaluate<T>(expression: string): Promise<T> {
    const result = await this.send("Runtime.evaluate", {
      awaitPromise: true,
      expression,
      returnByValue: true,
    })
    if (result.exceptionDetails) {
      throw new Error(JSON.stringify(result.exceptionDetails))
    }
    return result.result.value as T
  }

  close(): void {
    this.socket.close()
  }
}

class RawWebSocket {
  private buffer = Buffer.alloc(0)
  private readonly handlers: Array<(text: string) => void> = []
  private socket?: net.Socket
  private readonly url: { host: string; path: string; port: number }

  constructor(url: string) {
    const parsed = new URL(url)
    this.url = {
      host: parsed.hostname,
      path: `${parsed.pathname}${parsed.search}`,
      port: Number(parsed.port),
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection({ host: this.url.host, port: this.url.port }, () => {
        const key = crypto.randomBytes(16).toString("base64")
        this.socket!.write(
          [
            `GET ${this.url.path} HTTP/1.1`,
            `Host: ${this.url.host}:${this.url.port}`,
            "Upgrade: websocket",
            "Connection: Upgrade",
            `Sec-WebSocket-Key: ${key}`,
            "Sec-WebSocket-Version: 13",
            "",
            "",
          ].join("\r\n"),
        )
      })

      let handshake = ""
      const onData = (chunk: Buffer) => {
        handshake += chunk.toString("binary")
        const end = handshake.indexOf("\r\n\r\n")
        if (end === -1) return
        const rest = Buffer.from(handshake.slice(end + 4), "binary")
        if (!handshake.startsWith("HTTP/1.1 101")) {
          reject(new Error(handshake.slice(0, end)))
          return
        }
        this.socket!.off("data", onData)
        this.socket!.on("data", (data) => this.readFrames(Buffer.from(data)))
        if (rest.length) this.readFrames(rest)
        resolve()
      }

      this.socket.on("data", onData)
      this.socket.on("error", reject)
    })
  }

  onMessage(handler: (text: string) => void): void {
    this.handlers.push(handler)
  }

  send(text: string): void {
    this.socket!.write(encodeFrame(text))
  }

  close(): void {
    this.socket?.end()
  }

  private readFrames(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk])
    while (this.buffer.length >= 2) {
      const first = this.buffer[0]!
      const second = this.buffer[1]!
      const opcode = first & 0x0f
      let length = second & 0x7f
      let offset = 2

      if (length === 126) {
        if (this.buffer.length < offset + 2) return
        length = this.buffer.readUInt16BE(offset)
        offset += 2
      }
      if (length === 127) {
        throw new Error("Large WebSocket frames are not supported by this test helper")
      }

      const masked = (second & 0x80) !== 0
      let mask: Buffer | undefined
      if (masked) {
        if (this.buffer.length < offset + 4) return
        mask = this.buffer.subarray(offset, offset + 4)
        offset += 4
      }

      if (this.buffer.length < offset + length) return
      const payload = Buffer.from(this.buffer.subarray(offset, offset + length))
      this.buffer = this.buffer.subarray(offset + length)

      if (mask) {
        for (let index = 0; index < payload.length; index += 1) {
          payload[index] = payload[index]! ^ mask[index % 4]!
        }
      }

      if (opcode === 1) {
        for (const handler of this.handlers) handler(payload.toString())
      }
      if (opcode === 8) return
    }
  }
}

function encodeFrame(text: string): Buffer {
  const payload = Buffer.from(text)
  if (payload.length >= 65_536) {
    throw new Error("Large WebSocket frames are not supported by this test helper")
  }

  const headerLength = payload.length < 126 ? 6 : 8
  const header = Buffer.alloc(headerLength)
  header[0] = 0x81

  if (payload.length < 126) {
    header[1] = 0x80 | payload.length
    crypto.randomFillSync(header, 2, 4)
  } else {
    header[1] = 0x80 | 126
    header.writeUInt16BE(payload.length, 2)
    crypto.randomFillSync(header, 4, 4)
  }

  const maskOffset = headerLength - 4

  for (let index = 0; index < payload.length; index += 1) {
    payload[index] = payload[index]! ^ header[maskOffset + (index % 4)]!
  }

  return Buffer.concat([header, payload])
}
