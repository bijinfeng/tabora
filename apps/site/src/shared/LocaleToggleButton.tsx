import * as stylex from "@stylexjs/stylex"
import { useSiteI18n } from "../app/AppShell"
import type { XStyle } from "./stylex"

export function LocaleToggleButton(props: { xstyle?: XStyle }) {
  const i18n = useSiteI18n()

  return (
    <button
      {...stylex.attrs(props.xstyle)}
      type="button"
      aria-label={i18n.t("a11y.toggleLocale")}
      onClick={() => i18n.toggleLocale()}
    >
      {i18n.t("locale.switch")}
    </button>
  )
}
