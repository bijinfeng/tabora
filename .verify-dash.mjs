import { chromium } from "playwright"

const BASE = process.env.BASE ?? "http://localhost:5178"
const browser = await chromium.launch({ channel: "chrome" })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: "zh-CN" })
const errors = []
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`))
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`)
})

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" })
const first = await page.locator("body").innerText()
console.log("variant:", first.includes("初始化管理员") ? "register" : "login")

// 首运行：创建管理员，应直接进 dashboard
await page.fill("#setup-email", "boss@example.com")
await page.fill("#setup-password", "sup3rsecret")
await page.fill("#setup-confirm", "sup3rsecret")
await page.getByRole("button", { name: "创建管理员" }).click()
await page.waitForTimeout(4000)

console.log("\n=== after 创建管理员 ===")
console.log("url:", page.url())
console.log("alerts:", await page.locator("[role=alert]").allInnerTexts())
const dash = await page.locator("body").innerText()
console.log("on dashboard:", !page.url().includes("/login"))
console.log("body:", JSON.stringify(dash.slice(0, 400)))
await page.screenshot({ path: "/tmp/dash/01-after-register.png" })

// 刷新后仍在 dashboard（会话 cookie 生效）
await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
console.log("\n=== reload / ===")
console.log("url:", page.url())
console.log("still authed:", !page.url().includes("/login"))

// 回到 /login 应被守卫弹回首页
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" })
console.log("\n=== visit /login while authed ===")
console.log("url:", page.url())

// 登出后重新登录，验证 login 页也能进 dashboard
const signedOut = await page.evaluate(async () => {
  const r = await fetch("/api/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
  return r.status
})
console.log("\nsign-out status:", signedOut)
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" })
const body2 = await page.locator("body").innerText()
console.log("variant now:", body2.includes("初始化管理员") ? "register" : "login")
await page.fill("#admin-email", "boss@example.com")
await page.fill("#admin-password", "sup3rsecret")
await page.getByRole("button", { name: "登录" }).click()
await page.waitForTimeout(4000)
console.log("\n=== after 登录 ===")
console.log("url:", page.url())
console.log("alerts:", await page.locator("[role=alert]").allInnerTexts())
console.log("on dashboard:", !page.url().includes("/login"))
console.log("body:", JSON.stringify((await page.locator("body").innerText()).slice(0, 400)))
await page.screenshot({ path: "/tmp/dash/02-after-login.png" })

console.log("\njs errors:", errors.length ? errors.join("\n") : "none")
await browser.close()
