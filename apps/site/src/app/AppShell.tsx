import { applyThemeTokens } from "@tabora/theme"
import { useLocation } from "@solidjs/router"
import {
  createContext,
  createEffect,
  createSignal,
  useContext,
  type Accessor,
  type JSX,
} from "solid-js"

import { Topbar } from "./Topbar"
import { darkTokens, lightTokens } from "./themeTokens"
import landingCssUrl from "../../../../docs/design/assets/tabora-landing.css?url"

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

export function AppShell(props: { children?: JSX.Element }) {
  const initialDark = () => {
    const saved = localStorage.getItem("tabora-theme")
    if (saved === "dark") return true
    if (saved === "light") return false
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  }

  const [dark, setDark] = createSignal(initialDark())
  const location = useLocation()
  const isPrototypePage = () => {
    const path = location.pathname
    return path === "/" || path === "/download" || path === "/docs"
  }

  const toggleDark = () => {
    setDark((value) => {
      const next = !value
      localStorage.setItem("tabora-theme", next ? "dark" : "light")
      return next
    })
  }

  createEffect(() => {
    applyThemeTokens(document.documentElement, dark() ? darkTokens : lightTokens)
    document.documentElement.classList.toggle("site-dark", dark())
    document.documentElement.classList.toggle("dark", dark())
  })

  createEffect(() => {
    document.documentElement.classList.toggle("site-prototype", isPrototypePage())
  })

  let landingStylesheet: HTMLLinkElement | null = null

  createEffect(() => {
    const path = location.pathname
    const needsLandingCss = path === "/" || path === "/download"

    if (needsLandingCss) {
      if (!landingStylesheet) {
        landingStylesheet = document.createElement("link")
        landingStylesheet.rel = "stylesheet"
        landingStylesheet.href = landingCssUrl
        landingStylesheet.dataset.siteLanding = "true"
        document.head.append(landingStylesheet)
      }
      return
    }

    landingStylesheet?.remove()
    landingStylesheet = null
  })

  createEffect(() => {
    const hash = location.hash
    if (hash) queueMicrotask(() => document.querySelector(hash)?.scrollIntoView())
    else queueMicrotask(() => window.scrollTo({ top: 0 }))
  })

  return (
    <SiteThemeContext.Provider value={{ dark, toggleDark }}>
      {isPrototypePage() ? (
        <div class="site-prototype-root" id="top">
          {props.children}
        </div>
      ) : (
        <div class="site" id="top">
          <Topbar onToggleTheme={toggleDark} />
          {props.children}
        </div>
      )}
    </SiteThemeContext.Provider>
  )
}
