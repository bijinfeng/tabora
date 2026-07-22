import { A } from "@solidjs/router"
import { Button, IconButton } from "@tabora/ui"
import * as stylex from "@stylexjs/stylex"

import { getSiteHref, useSiteI18n, useSiteTheme } from "../app/AppShell"

const styles = stylex.create({
  root: {
    backdropFilter: "blur(16px)",
    backgroundColor: "color-mix(in srgb, rgb(var(--tbr-color-page)) 90%, transparent)",
    borderBottom: "1px solid rgb(var(--tbr-color-line))",
    position: "sticky",
    top: 0,
    zIndex: 30,
  },
  inner: {
    alignItems: "center",
    display: "grid",
    gap: 24,
    gridTemplateColumns: "auto 1fr auto",
    marginInline: "auto",
    minHeight: 64,
    width: "min(calc(100% - 64px), 1180px)",
    "@media (max-width: 920px)": {
      gridTemplateColumns: "1fr auto",
    },
    "@media (max-width: 560px)": {
      minHeight: 58,
      width: "min(calc(100% - 32px), 1180px)",
    },
  },
  logo: {
    alignItems: "center",
    color: "rgb(var(--tbr-color-text))",
    display: "inline-flex",
    fontSize: 14,
    fontWeight: 760,
    gap: 10,
    textDecoration: "none",
  },
  logoMark: {
    backgroundColor: "rgb(var(--tbr-color-text))",
    border: "1px solid rgb(var(--tbr-color-line-strong))",
    borderRadius: 7,
    color: "rgb(var(--tbr-color-page))",
    display: "grid",
    height: 28,
    placeItems: "center",
    width: 28,
  },
  nav: {
    display: "flex",
    gap: 24,
    justifyContent: "center",
    "@media (max-width: 920px)": {
      display: "none",
    },
  },
  navLink: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 13,
    fontWeight: 560,
    textDecoration: "none",
    ":hover": {
      color: "rgb(var(--tbr-color-text))",
    },
    ":focus-visible": {
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: 2,
    },
  },
  navLinkActive: {
    color: "rgb(var(--tbr-color-text))",
    fontWeight: 680,
  },
  actions: {
    alignItems: "center",
    display: "flex",
    gap: 10,
  },
  actionButton: {
    fontSize: 14,
    height: 38,
    paddingInline: 16,
  },
})

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
    <header
      {...stylex.attrs(styles.root)}
      role="banner"
      data-od-id="topnav"
      data-component="SiteTopnav"
    >
      <div {...stylex.attrs(styles.inner)}>
        <A {...stylex.attrs(styles.logo)} href="/" aria-label="Tabora 首页" data-site-logo>
          <span {...stylex.attrs(styles.logoMark)} aria-hidden="true">
            T
          </span>
          <span>Tabora</span>
        </A>
        <nav {...stylex.attrs(styles.nav)} aria-label="主导航">
          <A
            {...stylex.attrs(styles.navLink, props.active === "home" && styles.navLinkActive)}
            href="/"
          >
            {i18n.t("nav.home")}
          </A>
          <A {...stylex.attrs(styles.navLink)} href="/#product">
            {i18n.t("nav.product")}
          </A>
          <A
            {...stylex.attrs(styles.navLink, props.active === "download" && styles.navLinkActive)}
            href="/download"
          >
            {i18n.t("nav.download")}
          </A>
          <A
            {...stylex.attrs(styles.navLink, props.active === "docs" && styles.navLinkActive)}
            href="/docs"
          >
            {i18n.t("nav.docs")}
          </A>
          <A {...stylex.attrs(styles.navLink)} href="/#plugins">
            {i18n.t("nav.officialPlugins")}
          </A>
        </nav>
        <div {...stylex.attrs(styles.actions)} data-site-nav-actions>
          {props.actions?.map((action) => (
            <Button
              href={getSiteHref(action.href)}
              size="md"
              variant={action.variant}
              xstyle={styles.actionButton}
            >
              {action.label}
            </Button>
          ))}
          <IconButton
            size="lg"
            variant="secondary"
            data-dark-toggle
            aria-label={i18n.t("a11y.toggleTheme")}
            onClick={() => {
              theme.toggleDark()
              emitThemeToast()
            }}
          >
            {theme.dark() ? (
              <svg
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
            ) : (
              <svg
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
            )}
          </IconButton>
        </div>
      </div>
    </header>
  )
}
