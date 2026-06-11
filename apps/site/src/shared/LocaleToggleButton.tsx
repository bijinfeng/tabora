import { useSiteI18n } from "../app/AppShell"

export function LocaleToggleButton(props: { class?: string }) {
  const i18n = useSiteI18n()

  return (
    <button
      class={props.class}
      type="button"
      aria-label={i18n.t("a11y.toggleLocale")}
      onClick={() => i18n.toggleLocale()}
    >
      {i18n.t("locale.switch")}
    </button>
  )
}
