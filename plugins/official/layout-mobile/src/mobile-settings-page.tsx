import * as stylex from "@stylexjs/stylex"
import { createComponent, createMemo, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { LayoutHostAPI } from "@tabora/plugin-api/sdk"
import { IconButton } from "@tabora/ui/button"
import ArrowLeft from "lucide-solid/icons/arrow-left"

import { styles } from "./styles"

export type SettingsPanelDescriptor = {
  id: string
  pluginId: string
  label: string
  title: string
  scope: "global" | "instance"
  sectionId: string
  content:
    | {
        kind: "schema"
        provider: string
      }
    | {
        kind: "view"
        view: string
      }
}

export type MobileSettingsPageProps = {
  host: LayoutHostAPI
  panels: SettingsPanelDescriptor[]
  activeSectionId: string | null
  onBack: () => void
  onSectionChange: (sectionId: string) => void
  getView?: (viewId: string) => ((props: any) => JSX.Element) | undefined
  getSettingsProvider?: (providerId: string) => any
  providerContext?: (panel: SettingsPanelDescriptor) => any
  panelProps?: (panel: SettingsPanelDescriptor) => any
}

export function MobileSettingsPage(props: MobileSettingsPageProps) {
  const currentPanel = createMemo(() => {
    const sectionId = props.activeSectionId
    return props.panels.find((p) => p.id === sectionId)
  })

  const handleNavToSection = (sectionId: string) => {
    props.onSectionChange(sectionId)
  }

  const renderPanelContent = (panel: SettingsPanelDescriptor) => {
    if (panel.content.kind === "view") {
      const View = props.getView?.(panel.content.view)
      if (!View) {
        return <p>设置面板不可用：{panel.id}</p>
      }
      try {
        const viewProps = props.panelProps?.(panel) ?? {}
        return createComponent(View, viewProps)
      } catch (error) {
        return <p>设置面板加载失败：{String(error)}</p>
      }
    }

    // Schema-based panels
    if (panel.content.kind === "schema") {
      const provider = props.getSettingsProvider?.(panel.content.provider)
      if (!provider) {
        return <p>设置提供者不可用：{panel.content.provider}</p>
      }
      // TODO: Render SettingsSchemaRenderer for mobile
      return <p>Schema 面板: {panel.label}</p>
    }

    return <p>未知面板类型</p>
  }

  return (
    <div {...stylex.attrs(styles.settingsPage)} data-mobile-settings-page>
      <header {...stylex.attrs(styles.settingsHeader)}>
        <IconButton size="md" variant="ghost" onClick={props.onBack} aria-label="返回">
          <ArrowLeft size={20} />
        </IconButton>
        <h1 {...stylex.attrs(styles.settingsTitle)}>
          {currentPanel() ? currentPanel()!.label : "设置"}
        </h1>
      </header>
      <div {...stylex.attrs(styles.settingsContent)}>
        <Show
          when={currentPanel()}
          fallback={
            <div {...stylex.attrs(styles.settingsNavList)}>
              <For each={props.panels}>
                {(panel, index) => (
                  <button
                    {...stylex.attrs(
                      styles.settingsNavItem,
                      index() < props.panels.length - 1 && styles.settingsNavItemBorder,
                    )}
                    onClick={() => handleNavToSection(panel.id)}
                  >
                    <span {...stylex.attrs(styles.settingsNavLabel)}>{panel.label}</span>
                    <span {...stylex.attrs(styles.settingsNavArrow)}>›</span>
                  </button>
                )}
              </For>
            </div>
          }
        >
          <div {...stylex.attrs(styles.settingsPanelContent)}>
            {renderPanelContent(currentPanel()!)}
          </div>
        </Show>
      </div>
    </div>
  )
}
