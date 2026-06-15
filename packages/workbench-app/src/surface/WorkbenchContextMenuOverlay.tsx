import { ListRow } from "@tabora/ui"
import { For, Show } from "solid-js"

import type { ShellTranslation } from "../i18n"
import type { WidgetContextSection } from "./WorkbenchShellChrome.types"

export function WorkbenchContextMenuOverlay(props: {
  menu: { x: number; y: number; instanceId: string } | null
  sections: WidgetContextSection[]
  tShell?: ShellTranslation
  onClose: () => void
}) {
  return (
    <Show when={props.menu}>
      {(menu) => (
        <div class="ctx-menu-overlay" onClick={props.onClose}>
          <div class="ctx-menu-panel" style={{ left: `${menu().x}px`, top: `${menu().y}px` }}>
            <For each={props.sections}>
              {(section, sectionIndex) => (
                <>
                  <Show when={sectionIndex() > 0}>
                    <hr class="ctx-menu-sep" />
                  </Show>
                  <For each={section.items}>
                    {(item) => (
                      <ListRow
                        class={`ctx-menu-item ${item.danger ? "ctx-menu-danger" : ""}`.trim()}
                        primary={item.label}
                        trailing={
                          <Show when={item.isCurrent}>
                            <span class="ctx-menu-check">
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
