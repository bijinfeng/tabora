import * as stylex from "@stylexjs/stylex"
import { createComponent, createEffect, createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import { Settings, X } from "lucide-solid"
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
import { color, font, motion, radius, shadow, space, zIndex } from "@tabora/theme/tokens.stylex"

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

const styles = stylex.create({
  overlay: {
    alignItems: "center",
    backdropFilter: "blur(2px)",
    backgroundColor: "rgb(var(--tbr-color-scrim) / 0.18)",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    opacity: 0,
    position: "fixed",
    transitionDuration: motion.normal,
    transitionProperty: "opacity",
    transitionTimingFunction: motion.ease,
    zIndex: zIndex.modal,
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: "1ms",
    },
  },
  entering: {
    opacity: 1,
  },
  window: {
    backgroundColor: color.surface,
    borderColor: color.lineStrong,
    borderRadius: radius.panel,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadow.floating,
    display: "flex",
    flexDirection: "column",
    height: "min(440px, calc(100vh - 64px))",
    overflow: "hidden",
    transform: "scale(0.97) translateY(10px)",
    transitionDuration: motion.normal,
    transitionProperty: "transform",
    transitionTimingFunction: motion.ease,
    width: "min(760px, calc(100vw - 48px))",
    "@media (max-width: 768px)": {
      width: "calc(100vw - 32px)",
    },
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: "1ms",
    },
  },
  windowEntering: {
    transform: "scale(1) translateY(0)",
  },
  header: {
    alignItems: "center",
    backgroundColor: color.surfaceSoft,
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    flex: "0 0 auto",
    gap: 10,
    justifyContent: "space-between",
    paddingBlock: 10,
    paddingInline: 12,
  },
  title: {
    alignItems: "center",
    display: "flex",
    gap: 9,
    minWidth: 0,
  },
  titleIcon: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.accent,
    display: "flex",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  titleCopy: {
    display: "grid",
    gap: 2,
    minWidth: 0,
  },
  titleStrong: {
    fontSize: 13,
    lineHeight: 1.2,
  },
  titleMeta: {
    color: color.textMuted,
    fontSize: 11,
    lineHeight: 1.25,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  close: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.textMuted,
    cursor: "pointer",
    display: "flex",
    flexShrink: 0,
    height: 28,
    justifyContent: "center",
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: motion.ease,
    width: 28,
    ":hover": {
      backgroundColor: color.surfaceHover,
      borderColor: color.lineStrong,
      color: color.text,
    },
    ":focus-visible": {
      outlineColor: color.focus,
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  body: {
    backgroundColor: color.surface,
    display: "grid",
    flex: 1,
    gridTemplateColumns: "154px minmax(0, 1fr)",
    minHeight: 0,
    "@media (max-width: 480px)": {
      gridTemplateColumns: "1fr",
      gridTemplateRows: "auto minmax(0, 1fr)",
    },
  },
  nav: {
    backgroundColor: color.surfaceSoft,
    borderColor: color.line,
    borderRadius: radius.panel,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    gap: 3,
    marginBottom: 10,
    marginLeft: 10,
    marginTop: 10,
    minHeight: 0,
    overflow: "auto",
    padding: 8,
    "@media (max-width: 480px)": {
      borderRadius: 0,
      borderWidth: 0,
      borderBottomStyle: "solid",
      borderBottomWidth: 1,
      margin: 0,
      maxHeight: 170,
    },
  },
  kicker: {
    color: color.textSubtle,
    fontSize: 10,
    fontWeight: font.bold,
    letterSpacing: "0.05em",
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 6,
    textTransform: "uppercase",
  },
  account: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.text,
    cursor: "pointer",
    display: "grid",
    gap: 8,
    gridTemplateColumns: "28px minmax(0, 1fr)",
    marginBottom: 7,
    minHeight: 48,
    padding: 7,
    textAlign: "left",
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
  selected: {
    backgroundColor: color.accentSoft,
    borderColor: color.accent,
    color: color.accent,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: color.accentSoft,
    borderColor: color.line,
    borderRadius: radius.pill,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.accent,
    display: "inline-flex",
    fontSize: 11,
    fontWeight: font.bold,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  accountCopy: {
    display: "grid",
    gap: 2,
    minWidth: 0,
  },
  accountName: {
    fontSize: 11,
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  accountMeta: {
    color: color.textSubtle,
    fontSize: 10,
    lineHeight: 1.25,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  navButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.textMuted,
    cursor: "pointer",
    display: "flex",
    fontSize: 11,
    fontWeight: font.semibold,
    gap: 8,
    height: 28,
    justifyContent: "space-between",
    paddingInline: 8,
    ":hover": {
      backgroundColor: color.surfaceHover,
      color: color.text,
    },
    ":focus-visible": {
      outlineColor: color.focus,
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  navCount: {
    color: color.textSubtle,
    fontSize: 10,
    fontWeight: font.semibold,
  },
  main: {
    backgroundColor: color.surface,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minHeight: 0,
    overflow: "auto",
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 14,
    paddingTop: 12,
  },
  panelHeader: {
    alignItems: "center",
    display: "flex",
    flex: "0 0 auto",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 38,
    paddingBottom: 2,
  },
  panelHeaderTitle: {
    display: "block",
    fontSize: 13,
    lineHeight: 1.2,
    marginBottom: 3,
  },
  panelHeaderDescription: {
    color: color.textSubtle,
    display: "block",
    fontSize: 11,
    lineHeight: 1.35,
    maxWidth: 310,
  },
  panelView: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    minHeight: 0,
  },
  accountPanel: {
    display: "grid",
    flex: 1,
    placeItems: "center",
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    minHeight: 0,
  },
  accountStack: {
    margin: "auto",
    width: "min(100%, 322px)",
  },
  empty: {
    color: color.textMuted,
    fontSize: 13,
    paddingBlock: 24,
    paddingInline: 20,
    textAlign: "center",
  },
  missing: {
    color: color.danger,
    fontSize: 13,
    padding: 12,
  },
  footer: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderTopColor: color.line,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    color: color.textMuted,
    display: "flex",
    flex: "0 0 auto",
    fontSize: 10,
    gap: 10,
    justifyContent: "space-between",
    paddingBlock: 10,
    paddingInline: 12,
  },
  status: {
    alignItems: "center",
    color: color.textSubtle,
    display: "inline-flex",
    gap: 7,
    minWidth: 0,
  },
  statusDot: {
    backgroundColor: color.lineStrong,
    borderRadius: radius.pill,
    height: 6,
    width: 6,
  },
  footerActions: {
    alignItems: "center",
    display: "flex",
    gap: space.s2,
  },
})

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
        {...stylex.attrs(styles.overlay, isEntering() ? styles.entering : null)}
        data-workbench-overlay="settings"
        onClick={handleClose}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label={props.copy?.sidebarTitle ?? "设置"}
      >
        <div
          {...stylex.attrs(styles.window, isEntering() ? styles.windowEntering : null)}
          data-settings-window
          onClick={(e) => e.stopPropagation()}
        >
          <header {...stylex.attrs(styles.header)}>
            <div {...stylex.attrs(styles.title)}>
              <div {...stylex.attrs(styles.titleIcon)}>
                <Settings size={14} />
              </div>
              <div {...stylex.attrs(styles.titleCopy)}>
                <strong {...stylex.attrs(styles.titleStrong)}>
                  {props.copy?.sidebarTitle ?? "设置"}
                </strong>
                <span {...stylex.attrs(styles.titleMeta)}>
                  {props.copy?.windowSubtitle ??
                    "个人工作台配置 · 账号、布局、外观、搜索、AI、同步与插件"}
                </span>
              </div>
            </div>
            <button
              {...stylex.attrs(styles.close)}
              type="button"
              data-settings-close
              onClick={handleClose}
              ref={(el) => (closeButtonRef = el)}
              aria-label={props.copy?.closeAriaLabel ?? "关闭设置"}
            >
              <X size={16} />
            </button>
          </header>
          <div {...stylex.attrs(styles.body)}>
            <nav
              {...stylex.attrs(styles.nav)}
              data-settings-nav
              aria-label={props.copy?.sidebarTitle ?? "设置导航"}
            >
              <button
                {...stylex.attrs(
                  styles.account,
                  activeSection() === "account" ? styles.selected : null,
                )}
                type="button"
                data-settings-section="account"
                aria-current={activeSection() === "account" ? "page" : undefined}
                onClick={() => handleSectionChange("account")}
                aria-label={sectionTitle("account")}
              >
                <span {...stylex.attrs(styles.avatar)}>{props.copy?.accountNavAvatar ?? "未"}</span>
                <span {...stylex.attrs(styles.accountCopy)}>
                  <strong {...stylex.attrs(styles.accountName)}>
                    {props.copy?.accountNavName ?? "未登录"}
                  </strong>
                  <span {...stylex.attrs(styles.accountMeta)}>
                    {props.copy?.accountNavMeta ?? "本地模式"}
                  </span>
                </span>
              </button>
              <div {...stylex.attrs(styles.kicker)}>
                {props.copy?.workspaceGroupTitle ?? "工作台"}
              </div>
              <For each={workspaceSections()}>
                {(section) => (
                  <button
                    {...stylex.attrs(
                      styles.navButton,
                      section.id === activeSection() ? styles.selected : null,
                    )}
                    type="button"
                    data-settings-section={section.id}
                    aria-current={section.id === activeSection() ? "page" : undefined}
                    onClick={() => handleSectionChange(section.id)}
                  >
                    <span>{sectionTitle(section.id)}</span>
                    <Show when={sectionNavMeta(section.id)}>
                      <span {...stylex.attrs(styles.navCount)}>{sectionNavMeta(section.id)}</span>
                    </Show>
                  </button>
                )}
              </For>
              <div {...stylex.attrs(styles.kicker)}>
                {props.copy?.extensionGroupTitle ?? "扩展"}
              </div>
              <For each={extensionSections()}>
                {(section) => (
                  <button
                    {...stylex.attrs(
                      styles.navButton,
                      section.id === activeSection() ? styles.selected : null,
                    )}
                    type="button"
                    data-settings-section={section.id}
                    aria-current={section.id === activeSection() ? "page" : undefined}
                    onClick={() => handleSectionChange(section.id)}
                  >
                    <span>{sectionTitle(section.id)}</span>
                    <Show when={sectionNavMeta(section.id)}>
                      <span {...stylex.attrs(styles.navCount)}>{sectionNavMeta(section.id)}</span>
                    </Show>
                  </button>
                )}
              </For>
            </nav>
            <div {...stylex.attrs(styles.main)} data-active-view={activeSection()}>
              <Show when={activeSection() !== "account"}>
                <div {...stylex.attrs(styles.panelHeader)} data-settings-panel-header>
                  <div>
                    <strong {...stylex.attrs(styles.panelHeaderTitle)}>
                      {activeSectionTitle()}
                    </strong>
                    <span {...stylex.attrs(styles.panelHeaderDescription)}>
                      {activeSectionDescription()}
                    </span>
                  </div>
                  <Button size="sm" variant="secondary" onClick={handleReset}>
                    {props.copy?.resetLabel ?? "恢复默认"}
                  </Button>
                </div>
              </Show>
              <div
                {...stylex.attrs(
                  styles.panelView,
                  activeSection() === "account" ? styles.accountPanel : null,
                )}
                data-view={activeSection()}
              >
                <Show
                  when={activeSection() !== "about"}
                  fallback={
                    props.aboutContent ?? (
                      <EmptyState
                        xstyle={styles.empty}
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
                        xstyle={styles.empty}
                        compact
                        title={props.copy?.emptySection ?? "该分类下暂无设置内容"}
                      />
                    }
                  >
                    <div
                      {...stylex.attrs(
                        styles.stack,
                        activeSection() === "account" ? styles.accountStack : null,
                      )}
                      data-settings-panel-stack
                    >
                      <For each={activePanels()}>
                        {(panel) => {
                          const View = props.getView(panel.view)
                          if (!View)
                            return (
                              <InlineError xstyle={styles.missing}>
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
          <footer {...stylex.attrs(styles.footer)} data-workbench-overlay-footer>
            <span {...stylex.attrs(styles.status)}>
              <span {...stylex.attrs(styles.statusDot)} aria-hidden="true" />
              {statusText() ?? props.copy?.statusReady ?? "设置已就绪"}
            </span>
            <div {...stylex.attrs(styles.footerActions)}>
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
