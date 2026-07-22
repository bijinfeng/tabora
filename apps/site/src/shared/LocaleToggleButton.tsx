import { Button } from "@tabora/ui"
import type { StyleXStyles } from "@stylexjs/stylex"
import { useSiteI18n } from "../app/AppShell"

export function LocaleToggleButton(props: { xstyle?: StyleXStyles }) {
  const i18n = useSiteI18n()

  return (
    <Button
      size="sm"
      variant="secondary"
      xstyle={props.xstyle}
      aria-label={i18n.t("a11y.toggleLocale")}
      onClick={() => i18n.toggleLocale()}
    >
      {i18n.t("locale.switch")}
    </Button>
  )
}
