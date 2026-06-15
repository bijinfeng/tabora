import { ListRow } from "@tabora/ui"
import { For, Show } from "solid-js"

import type { ShellTranslation } from "../i18n"
import type { AvailableWidget } from "./WorkbenchShellChrome.types"

export function WorkbenchAddWidgetModal(props: {
  open: boolean
  availableWidgets: AvailableWidget[]
  widgetIconLabel: (icon?: string) => string
  tShell?: ShellTranslation
  onAdd: (pluginId: string, widgetId: string) => void
  onClose: () => void
}) {
  return (
    <Show when={props.open}>
      <div class="modal-overlay" onClick={props.onClose}>
        <div class="modal-container" onClick={(event) => event.stopPropagation()}>
          <div class="modal-title">{props.tShell?.("chrome.addWidget.title") ?? "添加卡片"}</div>
          <div class="modal-body">
            <For each={props.availableWidgets}>
              {(widget) => (
                <ListRow
                  class="add-widget-modal-item"
                  leading={
                    <span class="add-widget-modal-icon">{props.widgetIconLabel(widget.icon)}</span>
                  }
                  primary={
                    <span class="add-widget-modal-info">
                      <div class="add-widget-modal-name">{widget.title}</div>
                      <div class="add-widget-modal-desc">{widget.description}</div>
                    </span>
                  }
                  interactive
                  onClick={() => props.onAdd(widget.pluginId, widget.id)}
                />
              )}
            </For>
          </div>
        </div>
      </div>
    </Show>
  )
}
