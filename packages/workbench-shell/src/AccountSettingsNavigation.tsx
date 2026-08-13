import * as stylex from "@stylexjs/stylex"
import type { SettingsPanelNavigation } from "@tabora/plugin-api"
import { Button } from "@tabora/ui/button"
import { color, font, motion, radius } from "@tabora/theme/tokens.stylex"

export type AccountSettingsNavigationProps = {
  navigation: SettingsPanelNavigation | null
  fallbackName: string
  fallbackMeta: string
  fallbackAvatar: string
  active: boolean
  ariaLabel: string
  onSelect: () => void
}

const styles = stylex.create({
  button: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: 8,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.text,
    cursor: "pointer",
    display: "flex",
    gap: 8,
    justifyContent: "flex-start",
    minHeight: 48,
    padding: 7,
    textAlign: "left",
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: motion.ease,
    width: "100%",
    ":hover": {
      backgroundColor: color.surfaceHover,
      borderColor: color.lineStrong,
    },
    ":focus-visible": {
      outlineColor: color.focus,
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  active: {
    backgroundColor: color.accentSoft,
    borderColor: "color-mix(in srgb, rgb(var(--tbr-color-accent)) 34%, rgb(var(--tbr-color-line)))",
    ":hover": {
      backgroundColor: color.accentSoft,
      borderColor:
        "color-mix(in srgb, rgb(var(--tbr-color-accent)) 34%, rgb(var(--tbr-color-line)))",
    },
  },
  avatar: {
    alignItems: "center",
    backgroundColor: color.accentSoft,
    borderColor: "color-mix(in srgb, rgb(var(--tbr-color-accent)) 28%, rgb(var(--tbr-color-line)))",
    borderRadius: radius.pill,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.accent,
    display: "inline-flex",
    flexShrink: 0,
    fontSize: 11,
    fontWeight: font.bold,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  copy: {
    display: "grid",
    gap: 2,
    minWidth: 0,
  },
  name: {
    fontSize: 11,
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  meta: {
    color: color.textSubtle,
    fontSize: 10,
    lineHeight: 1.25,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
})

export function AccountSettingsNavigation(props: AccountSettingsNavigationProps) {
  const name = () => props.navigation?.title ?? props.fallbackName
  const meta = () => props.navigation?.meta ?? props.fallbackMeta
  const avatar = () => props.navigation?.avatar ?? props.fallbackAvatar

  return (
    <Button
      size="sm"
      variant="ghost"
      xstyle={[styles.button, props.active ? styles.active : null]}
      data-settings-section="account"
      aria-current={props.active ? "page" : undefined}
      aria-label={props.ariaLabel}
      onClick={props.onSelect}
    >
      <span {...stylex.attrs(styles.avatar)}>{avatar()}</span>
      <span {...stylex.attrs(styles.copy)}>
        <strong {...stylex.attrs(styles.name)}>{name()}</strong>
        <span {...stylex.attrs(styles.meta)}>{meta()}</span>
      </span>
    </Button>
  )
}
