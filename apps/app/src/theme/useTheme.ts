import { applyThemeTokens } from "@tabora/theme"
import { createEffect, createSignal } from "solid-js"
import { isServer } from "solid-js/web"

import { darkTokens, lightTokens } from "./tokens"

export type ColorScheme = "light" | "dark"

const STORAGE_KEY = "tabora.admin.color-scheme"

function readInitialScheme(): ColorScheme {
  // SSR 无 window/localStorage：默认亮色，客户端 hydration 后由 effect 纠正。
  if (isServer) return "light"
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "light" || stored === "dark") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

/** 明暗主题控制器：把 token 应用到根节点，并持久化用户选择。 */
export function createThemeController() {
  const [scheme, setScheme] = createSignal<ColorScheme>(readInitialScheme())

  createEffect(() => {
    if (isServer) return
    const current = scheme()
    applyThemeTokens(document.documentElement, current === "dark" ? darkTokens : lightTokens)
    document.documentElement.dataset.colorScheme = current
    localStorage.setItem(STORAGE_KEY, current)
  })

  return {
    scheme,
    toggle: () => setScheme((prev) => (prev === "dark" ? "light" : "dark")),
  }
}
