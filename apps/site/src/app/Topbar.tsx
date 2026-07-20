import { TaboraMark } from "@tabora/brand"
import { A, useLocation } from "@solidjs/router"
import * as stylex from "@stylexjs/stylex"

import { useSiteI18n } from "./AppShell"
import { scrollToHash } from "../shared/scrollToHash"
import { LocaleToggleButton } from "../shared/LocaleToggleButton"
import { sx } from "../shared/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backdropFilter: "blur(18px)",
    backgroundColor: "color-mix(in srgb, rgb(var(--tbr-color-page)) 86%, transparent)",
    borderBottom: "1px solid rgb(var(--tbr-color-line))",
    display: "grid",
    gap: 20,
    gridTemplateColumns: "minmax(140px, auto) 1fr auto",
    marginBottom: 18,
    minHeight: 64,
    position: "sticky",
    top: 0,
    zIndex: 20,
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr auto",
      minHeight: 58,
    },
  },
  brand: {
    alignItems: "center",
    color: "rgb(var(--tbr-color-text))",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: 14,
    fontWeight: 760,
    gap: 9,
    textDecoration: "none",
  },
  brandMark: {
    color: "rgb(var(--tbr-color-text))",
    display: "block",
    flexShrink: 0,
    height: 24,
    width: 24,
  },
  nav: {
    display: "flex",
    gap: 22,
    justifyContent: "center",
    "@media (max-width: 900px)": {
      gap: 18,
      gridColumn: "1 / -1",
      justifyContent: "flex-start",
      overflowX: "auto",
      paddingBottom: 12,
    },
  },
  navLink: {
    backgroundColor: "transparent",
    borderWidth: 0,
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 620,
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
  },
  actions: {
    alignItems: "center",
    display: "inline-flex",
    gap: 10,
  },
  control: {
    alignItems: "center",
    backgroundColor: "transparent",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-pill)",
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: 12,
    fontWeight: 680,
    justifyContent: "center",
    minHeight: 32,
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface))",
      borderColor: "rgb(var(--tbr-color-line-strong))",
      color: "rgb(var(--tbr-color-text))",
    },
    ":focus-visible": {
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: 2,
    },
  },
  localeControl: {
    paddingInline: 12,
  },
  themeControl: {
    padding: 0,
    width: 32,
  },
  themeDot: {
    backgroundColor: "rgb(var(--tbr-color-accent))",
    borderRadius: "50%",
    height: 9,
    width: 9,
  },
})

export function Topbar(props: { onToggleTheme: () => void }) {
  const location = useLocation()
  const isDocs = () => location.pathname.startsWith("/docs")
  const i18n = useSiteI18n()

  return (
    <header {...sx(styles.root)} role="banner">
      <A {...sx(styles.brand)} aria-label="Tabora 首页" href="/">
        <TaboraMark {...sx(styles.brandMark)} />
        <span>Tabora</span>
      </A>
      <nav {...sx(styles.nav)} aria-label="主导航">
        <A {...sx(styles.navLink)} href="/#workbench" onClick={() => scrollToHash("#workbench")}>
          {i18n.t("nav.workbench")}
        </A>
        <A {...sx(styles.navLink)} href="/#anatomy" onClick={() => scrollToHash("#anatomy")}>
          {i18n.t("nav.anatomy")}
        </A>
        <A {...sx(styles.navLink)} href="/#layouts" onClick={() => scrollToHash("#layouts")}>
          {i18n.t("nav.layouts")}
        </A>
        <A {...sx(styles.navLink)} href="/#plugins" onClick={() => scrollToHash("#plugins")}>
          {i18n.t("nav.plugins")}
        </A>
        <A {...sx(styles.navLink)} href="/download">
          {i18n.t("nav.download")}
        </A>
        <A {...sx(styles.navLink, isDocs() && styles.navLinkActive)} href="/docs">
          {i18n.t("nav.docs")}
        </A>
      </nav>
      <div {...sx(styles.actions)}>
        <LocaleToggleButton xstyle={[styles.control, styles.localeControl]} />
        <button
          {...sx(styles.control, styles.themeControl)}
          type="button"
          aria-label={i18n.t("a11y.toggleTheme")}
          onClick={props.onToggleTheme}
        >
          <span {...sx(styles.themeDot)} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
