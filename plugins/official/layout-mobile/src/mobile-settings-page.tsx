import * as stylex from "@stylexjs/stylex"
import { createMemo, For, Show } from "solid-js"
import type { LayoutHostAPI } from "@tabora/plugin-api/sdk"
import { IconButton } from "@tabora/ui/button"
import ArrowLeft from "lucide-solid/icons/arrow-left"

import { styles } from "./styles"

export type MobileSettingsPageProps = {
  host: LayoutHostAPI
  activeSectionId: string | null
  onBack: () => void
  onSectionChange: (sectionId: string) => void
}

export function MobileSettingsPage(props: MobileSettingsPageProps) {
  // TODO: 获取设置面板列表
  const panels = createMemo(() => [
    { id: "general", label: "通用" },
    { id: "appearance", label: "外观" },
    { id: "search", label: "搜索" },
    { id: "plugins", label: "插件" },
    { id: "about", label: "关于" },
  ])

  const currentPanel = createMemo(() => {
    const sectionId = props.activeSectionId
    return panels().find((p) => p.id === sectionId)
  })

  const handleNavToSection = (sectionId: string) => {
    props.onSectionChange(sectionId)
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
              <For each={panels()}>
                {(panel, index) => (
                  <button
                    {...stylex.attrs(
                      styles.settingsNavItem,
                      index() < panels().length - 1 && styles.settingsNavItemBorder,
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
            {/* TODO: 渲染实际的设置面板内容 */}
            <p>设置面板内容: {currentPanel()!.label}</p>
          </div>
        </Show>
      </div>
    </div>
  )
}
