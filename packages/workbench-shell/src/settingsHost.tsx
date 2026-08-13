import * as stylex from "@stylexjs/stylex"
import { createComponent, createEffect, createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import Settings from "lucide-solid/icons/settings"
import X from "lucide-solid/icons/x"
import type {
  PluginManifest,
  SettingsPanelProvider,
  SettingsPanelProviderContext,
  SettingsPanelNavigation,
  SettingsPanelViewProps,
  SettingsSurface,
} from "@tabora/plugin-api"
import {
  createSettingsNavigator,
  filterSettingsPanelsBySurface,
  normalizeSettingsPanelDescriptor,
  SETTINGS_SECTIONS,
  type SettingsPanelDescriptor as NavigatorSettingsPanelDescriptor,
  type SettingsSectionId,
} from "@tabora/orchestrator"
import { Button, IconButton } from "@tabora/ui/button"
import { EmptyState } from "@tabora/ui/empty-state"
import { InlineError } from "@tabora/ui/inline-error"
import { AccountSettingsNavigation } from "./AccountSettingsNavigation"
import { createPluginErrorFallback, PluginViewBoundary } from "./PluginViewBoundary"
import { SettingsSchemaRenderer } from "./SettingsSchemaRenderer"
import { color, font, motion, radius, shadow, space, zIndex } from "@tabora/theme/tokens.stylex"
import { MobileSettingsHeader } from "./MobileSettingsHeader"
import { MobileSettingsIndex } from "./mobileSettingsIndex"

type PluginLike = { manifest: Pick<PluginManifest, "id" | "contributes"> }

export type SettingsPanelDescriptor = NavigatorSettingsPanelDescriptor
export type { SettingsSectionId }
export { resolveInitialSettingsPanelId, resolveSettingsSectionId } from "@tabora/orchestrator"

export type SettingsHostProps = {
  open: boolean
  panels: SettingsPanelDescriptor[]
  surface: SettingsSurface
  /** Renders the mobile settings landing page instead of a section detail view. */
  showIndex?: boolean
  /** Keeps an explicit settings route visible when its section has no available panel. */
  preserveActiveSection?: boolean
  activeSectionId: SettingsSectionId | null
  onSectionChange: (sectionId: SettingsSectionId) => void
  onClose: () => void
  /** Returns from a mobile section detail page to the settings landing page. */
  onBack?: () => void
  getView: (viewId: string) => ((props: SettingsPanelViewProps) => JSX.Element) | undefined
  getSettingsProvider: (providerId: string) => SettingsPanelProvider | undefined
  providerContext?: (
    panel: SettingsPanelDescriptor,
    surface: SettingsSurface,
  ) => SettingsPanelProviderContext
  panelProps: (
    panel: SettingsPanelDescriptor,
    instanceId: string | undefined,
    surface: SettingsSurface,
  ) => SettingsPanelViewProps
  /** Instance-scoped panels are hidden unless the host explicitly supplies this target. */
  instanceId?: string
  aboutContent?: JSX.Element
  copy?: SettingsHostCopy
}

export type SettingsHostCopy = {
  sidebarTitle: string
  pluginGroupTitle: string
  pluginInstalledNav: string
  pluginsActiveTitle: string
  closeAriaLabel: string
  backAriaLabel?: string
  searchPlaceholder?: string
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
  cancelLabel?: string
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
  mobilePage: {
    backgroundColor: color.page,
    color: color.text,
    display: "flex",
    flexDirection: "column",
    minHeight: "100dvh",
    overflow: "hidden",
    width: "100%",
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
    "@media (min-width: 1024px)": {
      height: "min(600px, calc(100vh - 64px))",
      width: "min(920px, calc(100vw - 48px))",
    },
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
  mobilePageWindow: {
    backgroundColor: color.surface,
    display: "flex",
    flex: 1,
    flexDirection: "column",
    minHeight: 0,
    width: "100%",
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
    gap: 10,
    gridTemplateColumns: "154px minmax(0, 1fr)",
    minHeight: 0,
    padding: 10,
    "@media (max-width: 480px)": {
      gridTemplateColumns: "1fr",
      gridTemplateRows: "auto minmax(0, 1fr)",
    },
  },
  bodyMobile: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    padding: 0,
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
    margin: 0,
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
  navButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 7,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.textMuted,
    cursor: "pointer",
    display: "flex",
    fontSize: 11,
    fontWeight: 600,
    gap: 8,
    height: 28,
    justifyContent: "space-between",
    // Button 基础样式是 lineHeight: 1，行盒被压到 11px；中日韩字形在零 half-leading 下
    // 光学中心会偏下，flex 居中的是行盒不是字形。设计稿的 .nav-button 未声明 line-height，
    // 继承 normal，这里跟随。
    lineHeight: "normal",
    paddingBlock: 0,
    paddingInline: 8,
    textAlign: "left",
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: motion.ease,
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
  navButtonActive: {
    backgroundColor: color.accentSoft,
    borderColor: "color-mix(in srgb, rgb(var(--tbr-color-accent)) 28%, rgb(var(--tbr-color-line)))",
    color: color.accent,
    ":hover": {
      backgroundColor: color.accentSoft,
      borderColor:
        "color-mix(in srgb, rgb(var(--tbr-color-accent)) 28%, rgb(var(--tbr-color-line)))",
      color: color.accent,
    },
    ":active": {
      backgroundColor: color.accentSoft,
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
    gap: 10,
    minHeight: 0,
    overflow: "auto",
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 14,
    paddingTop: 12,
  },
  mainAccount: {
    justifyContent: "center",
  },
  mainMobile: {
    borderRadius: 0,
    borderStyle: "none",
    borderWidth: 0,
    gap: 16,
    overflow: "auto",
    padding: 16,
    paddingBottom: 20,
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
  panelHeaderMobile: {
    alignItems: "flex-start",
    minHeight: 44,
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
    gap: 8,
    minHeight: 0,
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minHeight: 0,
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
  surface: SettingsSurface = "desktop",
): SettingsSectionId {
  return createSettingsNavigator(panels, surface).initialSectionId(requested)
}

export function SettingsHost(props: SettingsHostProps) {
  let closeButtonRef: HTMLButtonElement | undefined
  let previousFocusedElement: HTMLElement | null = null
  const navigablePanels = () =>
    filterSettingsPanelsBySurface(props.panels, props.surface).filter(
      (panel) => panel.scope !== "instance" || Boolean(props.instanceId),
    )
  const navigator = () => createSettingsNavigator(navigablePanels(), props.surface)

  const [isEntering, setIsEntering] = createSignal(false)
  const [isClosing, setIsClosing] = createSignal(false)
  const [statusText, setStatusText] = createSignal<string | null>(null)
  const [accountNavigation, setAccountNavigation] = createSignal<SettingsPanelNavigation | null>(
    null,
  )

  const handleClose = () => {
    if (isClosing()) return
    if (props.surface === "mobile") {
      props.onClose()
      return
    }
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

  const activeSection = (): SettingsSectionId => {
    const requested = props.activeSectionId
    if (
      requested &&
      (props.preserveActiveSection || navigator().sections[requested].panels.length > 0)
    ) {
      return requested
    }
    return (
      SETTINGS_SECTIONS.find((section) => navigator().sections[section.id].panels.length > 0)?.id ??
      "about"
    )
  }
  const activePanels = () => navigator().sections[activeSection()].panels
  const sectionTitle = (sectionId: SettingsSectionId) =>
    props.copy?.sectionTitle(sectionId) ??
    SETTINGS_SECTIONS.find((section) => section.id === sectionId)?.title ??
    "设置"
  const sectionDescription = (sectionId: SettingsSectionId) =>
    props.copy?.sectionDescription?.(sectionId) ?? SECTION_FALLBACK_DESCRIPTIONS[sectionId]
  const activeSectionTitle = () => sectionTitle(activeSection())
  const activeSectionDescription = () => sectionDescription(activeSection())
  const accountSectionAvailable = () => navigator().sections.account.panels.length > 0
  const sectionNavMeta = (sectionId: SettingsSectionId) => {
    const panelCount = navigator().sections[sectionId].panels.length
    if (sectionId === "about") return props.copy?.sectionMeta?.(sectionId) ?? "V2"
    return panelCount > 0 ? String(panelCount) : ""
  }
  const workspaceSections = () =>
    SETTINGS_SECTIONS.filter(
      (section) =>
        WORKSPACE_SECTION_IDS.includes(section.id) &&
        navigator().sections[section.id].panels.length,
    )
  const extensionSections = () =>
    SETTINGS_SECTIONS.filter(
      (section) =>
        EXTENSION_SECTION_IDS.includes(section.id) &&
        (section.id === "about" || navigator().sections[section.id].panels.length),
    )

  const handleSectionChange = (sectionId: SettingsSectionId) => {
    props.onSectionChange(sectionId)
    setStatusText(
      props.copy?.statusSectionChanged?.(sectionTitle(sectionId)) ??
        `已切换到${sectionTitle(sectionId)}`,
    )
  }

  const handleBack = () => {
    if (props.onBack) {
      props.onBack()
      return
    }
    handleClose()
  }

  createEffect(() => {
    if (props.open && !props.showIndex && props.activeSectionId !== activeSection()) {
      props.onSectionChange(activeSection())
    }
  })

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

  const renderSettingsWindow = () => (
    <div
      {...stylex.attrs(
        props.surface === "mobile" ? styles.mobilePageWindow : styles.window,
        props.surface === "desktop" && isEntering() ? styles.windowEntering : null,
      )}
      data-settings-window
      onClick={(e) => e.stopPropagation()}
    >
      <Show
        when={props.surface === "mobile"}
        fallback={
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
            <IconButton
              size="sm"
              xstyle={styles.close}
              data-settings-close
              onClick={handleClose}
              ref={(el) => (closeButtonRef = el)}
              aria-label={props.copy?.closeAriaLabel ?? "关闭设置"}
            >
              <X size={16} />
            </IconButton>
          </header>
        }
      >
        <MobileSettingsHeader
          title={activeSectionTitle()}
          onBack={handleBack}
          backButtonRef={(el) => (closeButtonRef = el)}
          backAriaLabel={props.copy?.backAriaLabel ?? "返回工作台"}
        />
      </Show>
      <div {...stylex.attrs(styles.body, props.surface === "mobile" ? styles.bodyMobile : null)}>
        <Show when={props.surface === "desktop"}>
          <nav
            {...stylex.attrs(styles.nav)}
            data-settings-nav
            aria-label={props.copy?.sidebarTitle ?? "设置导航"}
          >
            <Show when={accountSectionAvailable()}>
              <AccountSettingsNavigation
                navigation={accountNavigation()}
                fallbackName={props.copy?.accountNavName ?? "未登录"}
                fallbackMeta={props.copy?.accountNavMeta ?? "本地模式"}
                fallbackAvatar={props.copy?.accountNavAvatar ?? "未"}
                active={activeSection() === "account"}
                ariaLabel={sectionTitle("account")}
                onSelect={() => handleSectionChange("account")}
              />
            </Show>
            <div {...stylex.attrs(styles.kicker)}>
              {props.copy?.workspaceGroupTitle ?? "工作台"}
            </div>
            <For each={workspaceSections()}>
              {(section) => (
                <Button
                  size="sm"
                  variant="ghost"
                  xstyle={[
                    styles.navButton,
                    section.id === activeSection() ? styles.navButtonActive : null,
                  ]}
                  data-settings-section={section.id}
                  aria-current={section.id === activeSection() ? "page" : undefined}
                  onClick={() => handleSectionChange(section.id)}
                >
                  <span>{sectionTitle(section.id)}</span>
                  <Show when={sectionNavMeta(section.id)}>
                    <span {...stylex.attrs(styles.navCount)}>{sectionNavMeta(section.id)}</span>
                  </Show>
                </Button>
              )}
            </For>
            <div {...stylex.attrs(styles.kicker)}>{props.copy?.extensionGroupTitle ?? "扩展"}</div>
            <For each={extensionSections()}>
              {(section) => (
                <Button
                  size="sm"
                  variant="ghost"
                  xstyle={[
                    styles.navButton,
                    section.id === activeSection() ? styles.navButtonActive : null,
                  ]}
                  data-settings-section={section.id}
                  aria-current={section.id === activeSection() ? "page" : undefined}
                  onClick={() => handleSectionChange(section.id)}
                >
                  <span>{sectionTitle(section.id)}</span>
                  <Show when={sectionNavMeta(section.id)}>
                    <span {...stylex.attrs(styles.navCount)}>{sectionNavMeta(section.id)}</span>
                  </Show>
                </Button>
              )}
            </For>
          </nav>
        </Show>
        <div
          {...stylex.attrs(
            styles.main,
            props.surface === "desktop" && activeSection() === "account"
              ? styles.mainAccount
              : null,
            props.surface === "mobile" ? styles.mainMobile : null,
          )}
          data-active-view={activeSection()}
        >
          <Show when={activeSection() !== "account" || props.surface === "mobile"}>
            <div
              {...stylex.attrs(
                styles.panelHeader,
                props.surface === "mobile" ? styles.panelHeaderMobile : null,
              )}
              data-settings-panel-header
            >
              <div>
                <strong {...stylex.attrs(styles.panelHeaderTitle)}>{activeSectionTitle()}</strong>
                <span {...stylex.attrs(styles.panelHeaderDescription)}>
                  {activeSectionDescription()}
                </span>
              </div>
            </div>
          </Show>
          <div {...stylex.attrs(styles.panelView)} data-view={activeSection()}>
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
                <div {...stylex.attrs(styles.stack)} data-settings-panel-stack>
                  <For each={activePanels()}>
                    {(panel) => {
                      if (panel.content.kind === "schema") {
                        const provider = props.getSettingsProvider(panel.content.provider)
                        if (!provider)
                          return (
                            <InlineError xstyle={styles.missing}>
                              {props.copy?.panelMissing(panel.id) ?? `设置面板不可用：${panel.id}`}
                            </InlineError>
                          )
                        return (
                          <PluginViewBoundary instanceId={panel.id} title={panel.title}>
                            <div
                              data-tabora-plugin-id={panel.pluginId}
                              data-settings-surface={props.surface}
                            >
                              <SettingsSchemaRenderer
                                provider={provider}
                                {...(panel.section === "account"
                                  ? { onNavigationChange: setAccountNavigation }
                                  : {})}
                                context={{
                                  ...(props.providerContext?.(panel, props.surface) ?? {
                                    panel: {
                                      id: panel.id,
                                      pluginId: panel.pluginId,
                                      scope: panel.scope,
                                    },
                                  }),
                                  surface: props.surface,
                                  panel: {
                                    id: panel.id,
                                    pluginId: panel.pluginId,
                                    scope: panel.scope,
                                    ...(panel.scope === "instance" && props.instanceId
                                      ? { instanceId: props.instanceId }
                                      : {}),
                                  },
                                }}
                              />
                            </div>
                          </PluginViewBoundary>
                        )
                      }

                      const View = props.getView(panel.content.view)
                      if (!View)
                        return (
                          <InlineError xstyle={styles.missing}>
                            {props.copy?.panelMissing(panel.id) ?? `设置面板不可用：${panel.id}`}
                          </InlineError>
                        )
                      let content: JSX.Element
                      try {
                        const panelProps = props.panelProps(
                          panel,
                          panel.scope === "instance" ? props.instanceId : undefined,
                          props.surface,
                        )
                        content = createComponent(View, panelProps)
                      } catch (error) {
                        return createPluginErrorFallback(error, panel.id, panel.title)
                      }
                      return (
                        <PluginViewBoundary instanceId={panel.id} title={panel.title}>
                          <div
                            data-tabora-plugin-id={panel.pluginId}
                            data-settings-surface={props.surface}
                          >
                            {content}
                          </div>
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
      <Show when={props.surface === "desktop"}>
        <footer {...stylex.attrs(styles.footer)} data-workbench-overlay-footer>
          <span {...stylex.attrs(styles.status)}>
            <span {...stylex.attrs(styles.statusDot)} aria-hidden="true" />
            {statusText() ?? props.copy?.statusReady ?? "设置已就绪"}
          </span>
          <div {...stylex.attrs(styles.footerActions)}>
            <Button size="sm" variant="primary" onClick={handleClose}>
              {props.copy?.cancelLabel ?? "取消"}
            </Button>
          </div>
        </footer>
      </Show>
    </div>
  )

  const renderMobileSettingsIndex = () => (
    <MobileSettingsIndex
      title={props.copy?.sidebarTitle ?? "设置"}
      visibleSections={SETTINGS_SECTIONS.filter(
        (section) => section.id === "about" || navigator().sections[section.id].panels.length > 0,
      ).map((section) => section.id)}
      searchPlaceholder={props.copy?.searchPlaceholder ?? "搜索设置项"}
      sectionTitle={sectionTitle}
      sectionDescription={sectionDescription}
      {...(props.copy?.sectionMeta ? { sectionMeta: props.copy.sectionMeta } : {})}
      onSectionChange={handleSectionChange}
      onKeyDown={handleKeyDown}
      onClose={handleClose}
      {...(props.copy?.backAriaLabel ? { backAriaLabel: props.copy.backAriaLabel } : {})}
    />
  )

  return (
    <Show when={props.open}>
      <Show
        when={props.surface === "mobile"}
        fallback={
          <div
            {...stylex.attrs(styles.overlay, isEntering() ? styles.entering : null)}
            data-workbench-overlay="settings"
            data-settings-surface="desktop"
            onClick={handleClose}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label={props.copy?.sidebarTitle ?? "设置"}
          >
            {renderSettingsWindow()}
          </div>
        }
      >
        <Show
          when={props.showIndex}
          fallback={
            <main
              {...stylex.attrs(styles.mobilePage)}
              data-settings-page
              data-settings-surface="mobile"
              onKeyDown={handleKeyDown}
              aria-label={props.copy?.sidebarTitle ?? "设置"}
            >
              {renderSettingsWindow()}
            </main>
          }
        >
          {renderMobileSettingsIndex()}
        </Show>
      </Show>
    </Show>
  )
}
