import { applyThemeTokens } from "@tabora/theme"
import { useLocation } from "@solidjs/router"
import * as i18n from "@solid-primitives/i18n"
import * as stylex from "@stylexjs/stylex"
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  useContext,
  type Accessor,
  type JSX,
} from "solid-js"

import { Topbar } from "./Topbar"
import { darkTokens, lightTokens } from "./themeTokens"

const styles = stylex.create({
  prototypeRoot: {
    minHeight: "100vh",
  },
  siteRoot: {
    marginInline: "auto",
    width: "min(calc(100% - 32px), 1180px)",
    "@media (max-width: 560px)": {
      width: "min(calc(100% - 20px), 1180px)",
    },
  },
})

export type SiteThemeApi = {
  dark: Accessor<boolean>
  toggleDark: () => void
}

const SiteThemeContext = createContext<SiteThemeApi>()

export function useSiteTheme(): SiteThemeApi {
  const context = useContext(SiteThemeContext)
  if (!context) {
    throw new Error("useSiteTheme must be used within AppShell")
  }
  return context
}

const getLocalStorage = () => {
  try {
    const storage = window.localStorage as unknown as Storage | undefined
    if (!storage) return null
    if (typeof storage.getItem !== "function") return null
    if (typeof storage.setItem !== "function") return null
    return storage
  } catch {
    return null
  }
}

export type SiteLocale = "zh-CN" | "en"

export type SiteI18nApi = {
  locale: Accessor<SiteLocale>
  setLocale: (locale: SiteLocale) => void
  toggleLocale: () => void
  t: (key: string, params?: i18n.BaseTemplateArgs) => string
}

const SiteI18nContext = createContext<SiteI18nApi>()

export function useSiteI18n(): SiteI18nApi {
  const context = useContext(SiteI18nContext)
  if (!context) {
    throw new Error("useSiteI18n must be used within AppShell")
  }
  return context
}

const siteMessages: Record<SiteLocale, Record<string, string>> = {
  "zh-CN": {
    "a11y.toggleTheme": "切换主题",
    "a11y.toggleLocale": "切换语言",
    "locale.switch": "EN",
    "nav.home": "首页",
    "nav.product": "产品",
    "nav.officialPlugins": "官方插件",
    "nav.workbench": "工作台",
    "nav.anatomy": "界面",
    "nav.layouts": "布局",
    "nav.plugins": "插件",
    "nav.download": "下载",
    "nav.docs": "文档",
    "action.devDocs": "开发文档",
    "action.installDocs": "安装文档",
    "action.choosePlatform": "选择平台",
    "footer.componentSpec": "组件规范",
    "waitlist.invalidEmail": "请输入有效邮箱。",
    "waitlist.success": "已记录评审请求，下一步会进入 MVP 走查。",
    "waitlist.submit": "请求产品评审",
    "toast.theme.dark": "已切换为暗色主题。",
    "toast.theme.light": "已切换为明亮主题。",
  },
  en: {
    "a11y.toggleTheme": "Toggle theme",
    "a11y.toggleLocale": "Switch language",
    "locale.switch": "中文",
    "nav.home": "Home",
    "nav.product": "Product",
    "nav.officialPlugins": "Official plugins",
    "nav.workbench": "Workbench",
    "nav.anatomy": "UI",
    "nav.layouts": "Layouts",
    "nav.plugins": "Plugins",
    "nav.download": "Download",
    "nav.docs": "Docs",
    "action.devDocs": "Docs",
    "action.installDocs": "Install docs",
    "action.choosePlatform": "Platforms",
    "footer.componentSpec": "Component spec",
    "waitlist.invalidEmail": "Please enter a valid email.",
    "waitlist.success": "Review request recorded. The next step is the MVP walkthrough.",
    "waitlist.submit": "Request review",
    "toast.theme.dark": "Switched to dark theme.",
    "toast.theme.light": "Switched to light theme.",
  },
}

const normalizeLocale = (raw: string | null): SiteLocale | null => {
  if (!raw) return null
  const value = raw.trim().toLowerCase()
  if (value === "en" || value === "en-us" || value === "en_us") return "en"
  if (value === "zh" || value === "zh-cn" || value === "zh_cn") return "zh-CN"
  if (raw === "zh-CN") return "zh-CN"
  return null
}

const normalizePath = (raw: string) => {
  const path = raw.trim() || "/"
  const prefixed = path.startsWith("/") ? path : `/${path}`
  return prefixed.length > 1 ? prefixed.replace(/\/+$/, "") : prefixed
}

export const getSiteRoutePath = (pathname: string, base = import.meta.env.BASE_URL) => {
  const path = normalizePath(pathname)
  const basePath = normalizePath(base || "/")

  if (basePath === "/" || path === "/") return path
  if (path === basePath) return "/"
  if (path.startsWith(`${basePath}/`)) return normalizePath(path.slice(basePath.length))

  return path
}

export const getSiteHref = (href: string, base = import.meta.env.BASE_URL) => {
  const value = href.trim()
  if (
    !value ||
    value.startsWith("#") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:")
  ) {
    return href
  }

  const [rawPath = "/", hash = ""] = value.split("#", 2)
  const path = normalizePath(rawPath)
  const basePath = normalizePath(base || "/")
  const suffix = hash ? `#${hash}` : ""

  if (basePath === "/") return `${path}${suffix}`
  if (path === "/") return `${basePath}/${suffix}`
  if (path === basePath || path.startsWith(`${basePath}/`)) return `${path}${suffix}`

  return `${basePath}${path}${suffix}`
}

export const isPrototypeRoute = (pathname: string, base?: string) => {
  const path = getSiteRoutePath(pathname, base)
  return (
    path === "/" ||
    path === "/download" ||
    path === "/docs" ||
    (path.startsWith("/docs/") && !path.startsWith("/docs/components"))
  )
}

export function AppShell(props: { children?: JSX.Element }) {
  const initialDark = () => {
    const saved = getLocalStorage()?.getItem("tabora-theme") ?? null
    if (saved === "dark") return true
    if (saved === "light") return false
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  }

  const [dark, setDark] = createSignal(initialDark())
  const location = useLocation()
  const isPrototypePage = () => isPrototypeRoute(location.pathname)

  const initialLocale = () => {
    const paramLocale = normalizeLocale(new URLSearchParams(window.location.search).get("lang"))
    if (paramLocale) return paramLocale
    const saved = normalizeLocale(getLocalStorage()?.getItem("tabora-site-lang") ?? null)
    if (saved) return saved
    const browser = normalizeLocale(navigator.language)
    return browser ?? "zh-CN"
  }

  const [locale, setLocale] = createSignal<SiteLocale>(initialLocale())
  const toggleLocale = () => setLocale((value) => (value === "zh-CN" ? "en" : "zh-CN"))
  const dict = createMemo(() => i18n.flatten(siteMessages[locale()]))
  const translator = i18n.translator(dict, i18n.resolveTemplate)
  const t: SiteI18nApi["t"] = (key, params) => {
    return translator(key, params) ?? siteMessages["zh-CN"][key] ?? key
  }

  const toggleDark = () => {
    setDark((value) => {
      const next = !value
      getLocalStorage()?.setItem("tabora-theme", next ? "dark" : "light")
      return next
    })
  }

  createEffect(() => {
    applyThemeTokens(document.documentElement, dark() ? darkTokens : lightTokens)
  })

  createEffect(() => {
    const paramLocale = normalizeLocale(new URLSearchParams(location.search).get("lang"))
    if (paramLocale) setLocale(paramLocale)
  })

  createEffect(() => {
    getLocalStorage()?.setItem("tabora-site-lang", locale())
    document.documentElement.lang = locale()
  })

  createEffect(() => {
    const hash = location.hash
    if (hash) queueMicrotask(() => document.querySelector(hash)?.scrollIntoView())
    else queueMicrotask(() => window.scrollTo({ top: 0 }))
  })

  return (
    <SiteThemeContext.Provider value={{ dark, toggleDark }}>
      <SiteI18nContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
        {isPrototypePage() ? (
          <div
            {...stylex.attrs(styles.prototypeRoot)}
            id="top"
            data-site-shell
            data-site-prototype="true"
          >
            {props.children}
          </div>
        ) : (
          <div {...stylex.attrs(styles.siteRoot)} id="top" data-site-shell>
            <Topbar onToggleTheme={toggleDark} />
            {props.children}
          </div>
        )}
      </SiteI18nContext.Provider>
    </SiteThemeContext.Provider>
  )
}
