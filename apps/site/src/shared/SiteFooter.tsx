import { A } from "@solidjs/router"
import * as stylex from "@stylexjs/stylex"

import type { SiteI18nApi } from "../app/AppShell"

const styles = stylex.create({
  root: {
    borderTop: "1px solid rgb(var(--tbr-color-line))",
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 13,
    paddingBlock: 36,
  },
  inner: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: 20,
    justifyContent: "space-between",
    marginInline: "auto",
    width: "min(calc(100% - 64px), 1180px)",
    "@media (max-width: 560px)": {
      width: "min(calc(100% - 32px), 1180px)",
    },
  },
  links: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 12,
  },
  link: {
    color: "inherit",
    textDecoration: "none",
    ":hover": {
      color: "rgb(var(--tbr-color-text))",
    },
  },
})

export function SiteFooter(props: { i18n: SiteI18nApi }) {
  return (
    <footer {...stylex.attrs(styles.root)} data-od-id="footer" data-component="SiteFooter">
      <div {...stylex.attrs(styles.inner)}>
        <span>© 2026 Tabora</span>
        <span {...stylex.attrs(styles.links)}>
          <A {...stylex.attrs(styles.link)} href="/">
            {props.i18n.t("nav.home")}
          </A>{" "}
          ·{" "}
          <A {...stylex.attrs(styles.link)} href="/download">
            {props.i18n.t("nav.download")}
          </A>{" "}
          ·{" "}
          <A {...stylex.attrs(styles.link)} href="/docs">
            {props.i18n.t("nav.docs")}
          </A>{" "}
          ·{" "}
          <A {...stylex.attrs(styles.link)} href="/docs/components">
            {props.i18n.t("footer.componentSpec")}
          </A>
        </span>
      </div>
    </footer>
  )
}
