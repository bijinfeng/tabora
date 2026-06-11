import { TaboraMark } from "@tabora/brand"
import { A, useLocation } from "@solidjs/router"

import { useSiteI18n } from "./AppShell"
import { scrollToHash } from "../shared/scrollToHash"
import { LocaleToggleButton } from "../shared/LocaleToggleButton"

export function Topbar(props: { onToggleTheme: () => void }) {
  const location = useLocation()
  const isDocs = () => location.pathname.startsWith("/docs")
  const i18n = useSiteI18n()

  return (
    <header class="topbar">
      <A class="brand" aria-label="Tabora 首页" href="/">
        <TaboraMark class="brand-mark" />
        <span>Tabora</span>
      </A>
      <nav class="nav" aria-label="主导航">
        <A href="/#workbench" onClick={() => scrollToHash("#workbench")}>
          {i18n.t("nav.workbench")}
        </A>
        <A href="/#anatomy" onClick={() => scrollToHash("#anatomy")}>
          {i18n.t("nav.anatomy")}
        </A>
        <A href="/#layouts" onClick={() => scrollToHash("#layouts")}>
          {i18n.t("nav.layouts")}
        </A>
        <A href="/#plugins" onClick={() => scrollToHash("#plugins")}>
          {i18n.t("nav.plugins")}
        </A>
        <A href="/download">{i18n.t("nav.download")}</A>
        <A href="/docs" classList={{ active: isDocs() }}>
          {i18n.t("nav.docs")}
        </A>
      </nav>
      <div class="topbar-actions">
        <LocaleToggleButton class="lang-toggle" />
        <button
          class="theme-toggle"
          type="button"
          aria-label={i18n.t("a11y.toggleTheme")}
          onClick={props.onToggleTheme}
        >
          <span class="theme-dot" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
