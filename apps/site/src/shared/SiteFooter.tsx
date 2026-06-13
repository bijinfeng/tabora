import { A } from "@solidjs/router"

import type { SiteI18nApi } from "../app/AppShell"

export function SiteFooter(props: { i18n: SiteI18nApi }) {
  return (
    <footer class="site-footer" data-od-id="footer" data-component="SiteFooter">
      <div class="site-container site-footer-inner">
        <span>© 2026 Tabora</span>
        <span class="meta">
          <A href="/">{props.i18n.t("nav.home")}</A> ·{" "}
          <A href="/download">{props.i18n.t("nav.download")}</A> ·{" "}
          <A href="/docs">{props.i18n.t("nav.docs")}</A> ·{" "}
          <A href="/docs/components">{props.i18n.t("footer.componentSpec")}</A>
        </span>
      </div>
    </footer>
  )
}
