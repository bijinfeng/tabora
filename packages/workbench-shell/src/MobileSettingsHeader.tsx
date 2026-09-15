import * as stylex from "@stylexjs/stylex"
import ArrowLeft from "lucide-solid/icons/arrow-left"
import { IconButton } from "@tabora/ui/button"
import { color, font } from "@tabora/theme/tokens.stylex"

export type MobileSettingsHeaderProps = {
  title: string
  onBack: () => void
  backAriaLabel: string
}

const styles = stylex.create({
  header: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    flex: "0 0 auto",
    gap: 10,
    paddingBottom: 8,
    paddingLeft: 12,
    paddingRight: 16,
    paddingTop: "calc(6px + env(safe-area-inset-top))",
  },
  backButton: {
    flexShrink: 0,
    height: 44,
    width: 44,
    // 保留 44px 触摸区域，但不要让整个返回按钮在悬浮时变成大色块。
    ":hover": {
      backgroundColor: "transparent",
      color: color.text,
    },
  },
  title: {
    color: color.text,
    flex: 1,
    fontSize: 16,
    fontWeight: font.semibold,
    lineHeight: 1.3,
    margin: 0,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
})

export function MobileSettingsHeader(props: MobileSettingsHeaderProps) {
  return (
    <header {...stylex.attrs(styles.header)} data-settings-mobile-header>
      <IconButton
        size="md"
        xstyle={styles.backButton}
        data-settings-back
        onClick={props.onBack}
        aria-label={props.backAriaLabel}
      >
        <ArrowLeft size={20} />
      </IconButton>
      <h1 {...stylex.attrs(styles.title)} data-settings-mobile-title>
        {props.title}
      </h1>
    </header>
  )
}
