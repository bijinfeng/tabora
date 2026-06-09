import { applyThemeTokens } from "@tabora/theme"
import { useLocation } from "@solidjs/router"
import { createEffect, createSignal, type JSX } from "solid-js"

import { Topbar } from "./Topbar"
import { darkTokens, lightTokens } from "./themeTokens"

export function AppShell(props: { children?: JSX.Element }) {
  const [dark, setDark] = createSignal(false)
  const location = useLocation()

  createEffect(() => {
    applyThemeTokens(document.documentElement, dark() ? darkTokens : lightTokens)
    document.documentElement.classList.toggle("site-dark", dark())
  })

  createEffect(() => {
    const hash = location.hash
    if (hash) queueMicrotask(() => document.querySelector(hash)?.scrollIntoView())
    else queueMicrotask(() => window.scrollTo({ top: 0 }))
  })

  return (
    <div class="site" id="top">
      <Topbar onToggleTheme={() => setDark((value) => !value)} />
      {props.children}
    </div>
  )
}
