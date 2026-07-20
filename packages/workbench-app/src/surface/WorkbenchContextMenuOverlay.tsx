import * as stylex from "@stylexjs/stylex"
import { ListRow } from "@tabora/ui"
import { For, Show } from "solid-js"

import type { ShellTranslation } from "../i18n"
import { color, radius, shadow, zIndex } from "@tabora/theme/tokens.stylex"
import type { WidgetContextSection } from "./WorkbenchShellChrome.types"

const styles = stylex.create({
  overlay: {
    inset: 0,
    position: "fixed",
    zIndex: zIndex.dropdown,
  },
  panel: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadow.floating,
    minWidth: 180,
    padding: 6,
    position: "fixed",
    zIndex: zIndex.dropdown,
  },
  item: {
    borderRadius: radius.control,
    fontSize: 14,
    justifyContent: "space-between",
    paddingBlock: 8,
    paddingInline: 12,
  },
  check: {
    color: color.textMuted,
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 500,
    marginLeft: 16,
  },
  separator: {
    borderStyle: "none",
    borderWidth: 0,
    borderTopColor: color.line,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    height: 0,
    marginBlock: 6,
    marginInline: 0,
  },
})

export function WorkbenchContextMenuOverlay(props: {
  menu: { x: number; y: number; instanceId: string } | null
  sections: WidgetContextSection[]
  tShell?: ShellTranslation
  onClose: () => void
}) {
  return (
    <Show when={props.menu}>
      {(menu) => (
        <div
          {...stylex.attrs(styles.overlay)}
          data-workbench-overlay="context-menu"
          onClick={props.onClose}
        >
          <div
            class={stylex.attrs(styles.panel).class}
            data-context-menu-panel
            style={{ left: `${menu().x}px`, top: `${menu().y}px` }}
            onClick={(event) => event.stopPropagation()}
          >
            <For each={props.sections}>
              {(section, sectionIndex) => (
                <>
                  <Show when={sectionIndex() > 0}>
                    <hr {...stylex.attrs(styles.separator)} />
                  </Show>
                  <For each={section.items}>
                    {(item) => (
                      <ListRow
                        xstyle={styles.item}
                        data-danger={item.danger ? "" : undefined}
                        primary={item.label}
                        trailing={
                          <Show when={item.isCurrent}>
                            <span {...stylex.attrs(styles.check)}>
                              {props.tShell?.("chrome.contextMenu.current") ?? "当前"}
                            </span>
                          </Show>
                        }
                        danger={Boolean(item.danger)}
                        interactive
                        selected={Boolean(item.isCurrent)}
                        onClick={() => {
                          item.run()
                          props.onClose()
                        }}
                      />
                    )}
                  </For>
                </>
              )}
            </For>
          </div>
        </div>
      )}
    </Show>
  )
}
