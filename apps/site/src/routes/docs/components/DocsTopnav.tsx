import { A } from "@solidjs/router"

import { useSiteI18n, useSiteTheme } from "../../../app/AppShell"

export function DocsTopnav() {
  const i18n = useSiteI18n()
  const theme = useSiteTheme()

  return (
    <header class="topnav">
      <A class="topnav-logo" href="/" aria-label="Tabora 首页">
        <span class="topnav-logo-mark" aria-hidden="true">
          T
        </span>
        <span>Tabora</span>
      </A>
      <nav class="topnav-links" aria-label="主导航">
        <A href="/">{i18n.t("nav.home")}</A>
        <A href="/#product">{i18n.t("nav.product")}</A>
        <A href="/download">{i18n.t("nav.download")}</A>
        <A href="/docs" class="active" aria-current="page">
          {i18n.t("nav.docs")}
        </A>
      </nav>
      <div class="topnav-actions">
        <button
          class="icbtn icbtn-dark"
          type="button"
          aria-label={i18n.t("a11y.toggleTheme")}
          onClick={theme.toggleDark}
        >
          <svg
            class="icon-moon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <svg
            class="icon-sun"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </div>
    </header>
  )
}
