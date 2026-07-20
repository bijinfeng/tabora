import * as stylex from "@stylexjs/stylex"

import type { HomePageContent } from "../homePrototypeContent"

const styles = stylex.create({
  overlay: {
    backgroundColor: "rgb(var(--tbr-color-scrim) / 0.34)",
    display: "none",
    inset: 0,
    padding: "12vh 20px 20px",
    placeItems: "start center",
    position: "fixed",
    zIndex: "var(--tbr-z-modal)",
  },
  overlayOpen: {
    display: "grid",
  },
  palette: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line-strong))",
    borderRadius: "var(--tbr-radius-panel)",
    boxShadow: "var(--tbr-shadow-floating)",
    overflow: "hidden",
    width: "min(620px, 100%)",
  },
  head: {
    alignItems: "center",
    borderBottom: "1px solid rgb(var(--tbr-color-line))",
    display: "flex",
    gap: 10,
    padding: 14,
  },
  input: {
    backgroundColor: "transparent",
    borderWidth: 0,
    color: "rgb(var(--tbr-color-text))",
    flex: 1,
    minWidth: 0,
    outline: 0,
  },
  kbd: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: 6,
    color: "rgb(var(--tbr-color-text-muted))",
    display: "inline-flex",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 11,
    height: 22,
    justifyContent: "center",
    minWidth: 24,
  },
  list: {
    padding: 8,
  },
  item: {
    alignItems: "center",
    borderRadius: "var(--tbr-radius-control)",
    color: "rgb(var(--tbr-color-text))",
    display: "grid",
    gap: 12,
    gridTemplateColumns: "28px 1fr auto",
    minHeight: 46,
    paddingInline: 10,
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
    },
    "@media (max-width: 430px)": {
      gap: 4,
      gridTemplateColumns: "1fr",
      paddingBlock: 10,
    },
  },
  itemActive: {
    backgroundColor: "rgb(var(--tbr-color-surface-hover))",
  },
  itemDescription: {
    color: "rgb(var(--tbr-color-text-muted))",
  },
  meta: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 12,
  },
})

export function CommandDialog(props: {
  content: HomePageContent
  open: boolean
  close: () => void
  setInputRef: (element: HTMLInputElement) => void
}) {
  return (
    <div
      {...stylex.attrs(styles.overlay, props.open && styles.overlayOpen)}
      data-command-dialog
      data-site-command-dialog
      data-component="SiteCommandDialog"
      aria-hidden={!props.open}
      onClick={(event) => {
        if (event.target === event.currentTarget) props.close()
      }}
    >
      <div {...stylex.attrs(styles.palette)} role="dialog" aria-modal="true" aria-label="命令面板">
        <div {...stylex.attrs(styles.head)}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            {...stylex.attrs(styles.input)}
            ref={props.setInputRef}
            value={props.content.command.query}
            aria-label="命令搜索示例"
          />
          <span {...stylex.attrs(styles.kbd)}>Esc</span>
        </div>
        <div {...stylex.attrs(styles.list)}>
          {props.content.command.items.map(
            (item: [string, string, string, string], index: number) => (
              <div {...stylex.attrs(styles.item, index === 0 && styles.itemActive)}>
                <span {...stylex.attrs(styles.kbd)}>{item[0]}</span>
                <div>
                  <strong>{item[1]}</strong>
                  <br />
                  <span {...stylex.attrs(styles.itemDescription)}>{item[2]}</span>
                </div>
                <span {...stylex.attrs(styles.meta)}>{item[3]}</span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
