import { createComponent, createEffect, createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import { Settings } from "lucide-solid"
import type { PluginManifest, SettingsPanelViewProps } from "@tabora/plugin-api"
import {
  createSettingsNavigator,
  normalizeSettingsPanelDescriptor,
  SETTINGS_SECTIONS,
  type SettingsPanelDescriptor as NavigatorSettingsPanelDescriptor,
  type SettingsSectionId,
} from "@tabora/orchestrator"
import { Button, EmptyState, InlineError } from "@tabora/ui"
import { createPluginErrorFallback, PluginViewBoundary } from "./PluginViewBoundary"

type PluginLike = { manifest: Pick<PluginManifest, "id" | "contributes"> }

export type SettingsPanelDescriptor = NavigatorSettingsPanelDescriptor
export type { SettingsSectionId }
export { resolveInitialSettingsPanelId, resolveSettingsSectionId } from "@tabora/orchestrator"

export type SettingsHostProps = {
  open: boolean
  panels: SettingsPanelDescriptor[]
  activeSectionId: SettingsSectionId | null
  onSectionChange: (sectionId: SettingsSectionId) => void
  onClose: () => void
  getView: (viewId: string) => ((props: SettingsPanelViewProps) => JSX.Element) | undefined
  panelProps: (panel: SettingsPanelDescriptor) => SettingsPanelViewProps
  aboutContent?: JSX.Element
  copy?: SettingsHostCopy
}

export type SettingsHostCopy = {
  sidebarTitle: string
  pluginGroupTitle: string
  pluginInstalledNav: string
  pluginsActiveTitle: string
  closeAriaLabel: string
  aboutUnavailable: string
  emptySection: string
  panelMissing: (panelId: string) => string
  sectionTitle: (sectionId: SettingsSectionId) => string
  sectionDescription?: (sectionId: SettingsSectionId) => string
  sectionMeta?: (sectionId: SettingsSectionId) => string
  workspaceGroupTitle?: string
  extensionGroupTitle?: string
  accountNavName?: string
  accountNavMeta?: string
  accountNavAvatar?: string
  windowSubtitle?: string
  statusReady?: string
  statusSectionChanged?: (sectionTitle: string) => string
  statusReset?: string
  statusSaved?: string
  resetLabel?: string
  cancelLabel?: string
  saveLabel?: string
}

const SECTION_FALLBACK_DESCRIPTIONS: Record<SettingsSectionId, string> = {
  general: "工作区、布局和基础行为。所有设置只影响当前个人工作台。",
  appearance: "主题、背景和强调色。视觉配置来自主题插件。",
  search: "默认搜索源、搜索范围和命令入口。",
  account: "登录 Tabora 账号，用于云同步和设备注册。",
  ai: "模型提供商、默认模型、连接测试和插件 AI 授权。",
  sync: "状态、范围和处理。",
  plugins: "已安装插件、运行配置、设置表单协议和本地权限。",
  about: "版本、数据位置和插件化工作台说明。",
}

const WORKSPACE_SECTION_IDS: SettingsSectionId[] = ["general", "appearance", "search"]
const EXTENSION_SECTION_IDS: SettingsSectionId[] = ["ai", "sync", "plugins", "about"]

export function collectSettingsPanels(plugins: PluginLike[]): SettingsPanelDescriptor[] {
  const panels: SettingsPanelDescriptor[] = []
  for (const plugin of plugins) {
    for (const panel of plugin.manifest.contributes.settingsPanels ?? []) {
      panels.push(normalizeSettingsPanelDescriptor({ ...panel, pluginId: plugin.manifest.id }))
    }
  }
  return panels.sort(
    (l, r) => (l.order ?? 10_000) - (r.order ?? 10_000) || l.title.localeCompare(r.title),
  )
}

export function resolveInitialSettingsSectionId(
  panels: SettingsPanelDescriptor[],
  requested?: string | null,
): SettingsSectionId {
  return createSettingsNavigator(panels).initialSectionId(requested)
}

export function SettingsHost(props: SettingsHostProps) {
  let closeButtonRef: HTMLButtonElement | undefined
  let previousFocusedElement: HTMLElement | null = null
  const navigator = () => createSettingsNavigator(props.panels)

  const [isEntering, setIsEntering] = createSignal(false)
  const [isClosing, setIsClosing] = createSignal(false)
  const [statusText, setStatusText] = createSignal<string | null>(null)

  const handleClose = () => {
    if (isClosing()) return
    setIsClosing(true)
    setIsEntering(false)
    setTimeout(() => {
      setIsClosing(false)
      setStatusText(null)
      props.onClose()
    }, 250)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault()
      handleClose()
    }
  }

  const activeSection = () => props.activeSectionId ?? "general"
  const activePanels = () => navigator().sections[activeSection()].panels
  const sectionTitle = (sectionId: SettingsSectionId) =>
    props.copy?.sectionTitle(sectionId) ??
    SETTINGS_SECTIONS.find((section) => section.id === sectionId)?.title ??
    "设置"
  const activeSectionTitle = () => sectionTitle(activeSection())
  const activeSectionDescription = () =>
    props.copy?.sectionDescription?.(activeSection()) ??
    SECTION_FALLBACK_DESCRIPTIONS[activeSection()]
  const sectionNavMeta = (sectionId: SettingsSectionId) => {
    const panelCount = navigator().sections[sectionId].panels.length
    if (sectionId === "about") return props.copy?.sectionMeta?.(sectionId) ?? "V2"
    return panelCount > 0 ? String(panelCount) : ""
  }
  const workspaceSections = () =>
    SETTINGS_SECTIONS.filter((section) => WORKSPACE_SECTION_IDS.includes(section.id))
  const extensionSections = () =>
    SETTINGS_SECTIONS.filter((section) => EXTENSION_SECTION_IDS.includes(section.id))

  const handleSectionChange = (sectionId: SettingsSectionId) => {
    props.onSectionChange(sectionId)
    setStatusText(
      props.copy?.statusSectionChanged?.(sectionTitle(sectionId)) ??
        `已切换到${sectionTitle(sectionId)}`,
    )
  }

  const handleReset = () => {
    setStatusText(props.copy?.statusReset ?? "已恢复当前页默认值")
  }

  const handleSave = () => {
    setStatusText(props.copy?.statusSaved ?? "设置已保存到本地")
  }

  createEffect(() => {
    if (props.open) {
      previousFocusedElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      closeButtonRef?.focus()
      return
    }

    if (previousFocusedElement && document.contains(previousFocusedElement)) {
      previousFocusedElement.focus()
    }
    previousFocusedElement = null
  })

  createEffect(() => {
    if (props.open && !isClosing()) {
      setTimeout(() => setIsEntering(true), 10)
    } else {
      setIsEntering(false)
    }
  })

  return (
    <Show when={props.open}>
      <div
        class="settings-overlay settings-host"
        classList={{ "is-entering": isEntering() }}
        onClick={handleClose}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label={props.copy?.sidebarTitle ?? "设置"}
      >
        <div
          class="settings-window"
          classList={{ "is-entering": isEntering() }}
          onClick={(e) => e.stopPropagation()}
        >
          <header class="window-head">
            <div class="window-title">
              <div class="window-title-icon">
                <Settings size={14} />
              </div>
              <div class="window-title-main">
                <strong>{props.copy?.sidebarTitle ?? "设置"}</strong>
                <span>
                  {props.copy?.windowSubtitle ??
                    "个人工作台配置 · 账号、布局、外观、搜索、AI、同步与插件"}
                </span>
              </div>
            </div>
            <button
              class="icon-close"
              onClick={handleClose}
              ref={(el) => (closeButtonRef = el)}
              aria-label={props.copy?.closeAriaLabel ?? "关闭设置"}
            />
          </header>
          <div class="settings-body">
            <nav class="settings-nav" aria-label={props.copy?.sidebarTitle ?? "设置导航"}>
              <button
                class="account-entry"
                type="button"
                classList={{ "is-active": activeSection() === "account" }}
                onClick={() => handleSectionChange("account")}
                aria-label={sectionTitle("account")}
              >
                <span class="account-avatar">{props.copy?.accountNavAvatar ?? "未"}</span>
                <span class="account-nav-copy">
                  <strong>{props.copy?.accountNavName ?? "未登录"}</strong>
                  <span>{props.copy?.accountNavMeta ?? "本地模式"}</span>
                </span>
              </button>
              <div class="nav-kicker">{props.copy?.workspaceGroupTitle ?? "工作台"}</div>
              <For each={workspaceSections()}>
                {(section) => (
                  <button
                    class="nav-button"
                    classList={{ "is-active": section.id === activeSection() }}
                    onClick={() => handleSectionChange(section.id)}
                  >
                    <span>{sectionTitle(section.id)}</span>
                    <Show when={sectionNavMeta(section.id)}>
                      <span class="nav-count">{sectionNavMeta(section.id)}</span>
                    </Show>
                  </button>
                )}
              </For>
              <div class="nav-kicker">{props.copy?.extensionGroupTitle ?? "扩展"}</div>
              <For each={extensionSections()}>
                {(section) => (
                  <button
                    class="nav-button"
                    classList={{ "is-active": section.id === activeSection() }}
                    onClick={() => handleSectionChange(section.id)}
                  >
                    <span>{sectionTitle(section.id)}</span>
                    <Show when={sectionNavMeta(section.id)}>
                      <span class="nav-count">{sectionNavMeta(section.id)}</span>
                    </Show>
                  </button>
                )}
              </For>
            </nav>
            <div class="settings-main" data-active-view={activeSection()}>
              <Show when={activeSection() !== "account"}>
                <div class="panel-head">
                  <div>
                    <strong>{activeSectionTitle()}</strong>
                    <span>{activeSectionDescription()}</span>
                  </div>
                  <Button size="sm" variant="secondary" onClick={handleReset}>
                    {props.copy?.resetLabel ?? "恢复默认"}
                  </Button>
                </div>
              </Show>
              <div class="panel-view" classList={{ "is-active": true }} data-view={activeSection()}>
                <Show
                  when={activeSection() !== "about"}
                  fallback={
                    props.aboutContent ?? (
                      <EmptyState
                        class="settings-empty"
                        compact
                        title={props.copy?.aboutUnavailable ?? "关于信息暂不可用"}
                      />
                    )
                  }
                >
                  <Show
                    when={activePanels().length > 0}
                    fallback={
                      <EmptyState
                        class="settings-empty"
                        compact
                        title={props.copy?.emptySection ?? "该分类下暂无设置内容"}
                      />
                    }
                  >
                    <div class="settings-panel-stack-host">
                      <For each={activePanels()}>
                        {(panel) => {
                          const View = props.getView(panel.view)
                          if (!View)
                            return (
                              <InlineError class="settings-panel-missing">
                                {props.copy?.panelMissing(panel.id) ??
                                  `设置面板不可用：${panel.id}`}
                              </InlineError>
                            )
                          let content: JSX.Element
                          try {
                            content = createComponent(View, props.panelProps(panel))
                          } catch (error) {
                            return createPluginErrorFallback(error, panel.id, panel.title)
                          }
                          return (
                            <PluginViewBoundary instanceId={panel.id} title={panel.title}>
                              <div data-tabora-plugin-id={panel.pluginId}>{content}</div>
                            </PluginViewBoundary>
                          )
                        }}
                      </For>
                    </div>
                  </Show>
                </Show>
              </div>
            </div>
          </div>
          <footer class="window-foot">
            <span class="footer-status">
              {statusText() ?? props.copy?.statusReady ?? "设置已就绪"}
            </span>
            <div class="footer-actions">
              <Button size="sm" variant="secondary" onClick={handleClose}>
                {props.copy?.cancelLabel ?? "取消"}
              </Button>
              <Button size="sm" variant="primary" onClick={handleSave}>
                {props.copy?.saveLabel ?? "保存设置"}
              </Button>
            </div>
          </footer>
        </div>
      </div>
    </Show>
  )
}
