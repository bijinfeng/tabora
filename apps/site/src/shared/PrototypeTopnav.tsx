import { A } from "@solidjs/router"

import { useSiteI18n, useSiteTheme } from "../app/AppShell"
import { LocaleToggleButton } from "./LocaleToggleButton"

export type PrototypeTopnavAction = {
  href: string
  label: string
  variant: "primary" | "secondary"
}

export function PrototypeTopnav(props: {
  active: "home" | "download" | "docs"
  actions?: PrototypeTopnavAction[]
  onThemeToggled?: (message: string) => void
}) {
  const i18n = useSiteI18n()
  const theme = useSiteTheme()

  const emitThemeToast = () => {
    props.onThemeToggled?.(theme.dark() ? i18n.t("toast.theme.dark") : i18n.t("toast.theme.light"))
  }

  return (
    <header class="site-topnav" data-od-id="topnav" data-component="SiteTopnav">
      <div class="site-container site-topnav-inner">
        <A class="site-logo" href="/" aria-label="Tabora 首页">
          <span class="site-logo-mark" aria-hidden="true">
            T
          </span>
          <span>Tabora</span>
        </A>
        <nav class="site-navlinks" aria-label="主导航">
          <A classList={{ active: props.active === "home" }} href="/">
            {i18n.t("nav.home")}
          </A>
          <A href="/#product">{i18n.t("nav.product")}</A>
          <A classList={{ active: props.active === "download" }} href="/download">
            {i18n.t("nav.download")}
          </A>
          <A classList={{ active: props.active === "docs" }} href="/docs">
            {i18n.t("nav.docs")}
          </A>
          <A href="/#plugins">{i18n.t("nav.officialPlugins")}</A>
        </nav>
        <div class="site-nav-actions">
          {props.actions?.map((action) => (
            <A class={`btn btn-${action.variant}`} href={action.href}>
              {action.label}
            </A>
          ))}
          <LocaleToggleButton class="btn btn-secondary btn-sm" />
          <button
            class="btn btn-icon"
            type="button"
            data-dark-toggle
            aria-label={i18n.t("a11y.toggleTheme")}
            onClick={() => {
              theme.toggleDark()
              emitThemeToast()
            }}
          >
            <svg
              class="icon-moon"
              width="16"
              height="16"
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
              width="16"
              height="16"
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
      </div>
    </header>
  )
}
