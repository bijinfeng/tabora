import { A } from "@solidjs/router"
import { IconButton } from "@tabora/ui"
import * as stylex from "@stylexjs/stylex"

import { useSiteI18n, useSiteTheme } from "../../../app/AppShell"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderBottom: "1px solid rgb(var(--tbr-color-line))",
    display: "flex",
    gap: 24,
    height: 56,
    paddingInline: 28,
    position: "sticky",
    top: 0,
    zIndex: 100,
    "@media (max-width: 900px)": {
      gap: 14,
      overflow: "hidden",
      paddingInline: 16,
    },
  },
  logo: {
    alignItems: "center",
    color: "rgb(var(--tbr-color-text))",
    display: "flex",
    flex: "0 0 auto",
    fontSize: 15,
    fontWeight: 700,
    gap: 8,
    textDecoration: "none",
  },
  logoMark: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-accent))",
    borderRadius: 7,
    color: "rgb(var(--tbr-color-inverse))",
    display: "flex",
    fontSize: 13,
    fontWeight: 800,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  links: {
    display: "flex",
    flex: 1,
    gap: 4,
    minWidth: 0,
    overflowX: "auto",
  },
  link: {
    borderRadius: "var(--tbr-radius-control)",
    color: "rgb(var(--tbr-color-text-muted))",
    flex: "0 0 auto",
    fontSize: 13,
    fontWeight: 500,
    paddingBlock: 6,
    paddingInline: 12,
    textDecoration: "none",
    whiteSpace: "nowrap",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
      color: "rgb(var(--tbr-color-text))",
    },
  },
  active: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    color: "rgb(var(--tbr-color-accent))",
    fontWeight: 650,
  },
  actions: {
    display: "flex",
    flex: "0 0 auto",
    marginLeft: "auto",
  },
  themeControl: {
    height: 30,
    width: 30,
  },
})

export function DocsTopnav() {
  const i18n = useSiteI18n()
  const theme = useSiteTheme()

  return (
    <header {...stylex.attrs(styles.root)} role="banner">
      <A {...stylex.attrs(styles.logo)} href="/" aria-label="Tabora 首页">
        <span {...stylex.attrs(styles.logoMark)} aria-hidden="true">
          T
        </span>
        <span>Tabora</span>
      </A>
      <nav {...stylex.attrs(styles.links)} aria-label="主导航">
        <A {...stylex.attrs(styles.link)} href="/">
          {i18n.t("nav.home")}
        </A>
        <A {...stylex.attrs(styles.link)} href="/#product">
          {i18n.t("nav.product")}
        </A>
        <A {...stylex.attrs(styles.link)} href="/download">
          {i18n.t("nav.download")}
        </A>
        <A {...stylex.attrs(styles.link, styles.active)} href="/docs" aria-current="page">
          {i18n.t("nav.docs")}
        </A>
      </nav>
      <div {...stylex.attrs(styles.actions)}>
        <IconButton
          size="sm"
          variant="secondary"
          xstyle={styles.themeControl}
          aria-label={i18n.t("a11y.toggleTheme")}
          onClick={theme.toggleDark}
        >
          {theme.dark() ? (
            <svg
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
          ) : (
            <svg
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
          )}
        </IconButton>
      </div>
    </header>
  )
}
