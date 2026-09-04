import * as stylex from "@stylexjs/stylex"
import { createComponent, createEffect, createSignal, For, onCleanup, Show } from "solid-js"
import type { JSX } from "solid-js"
import Settings from "lucide-solid/icons/settings"
import X from "lucide-solid/icons/x"
import type {
  SettingsPanelNavigation,
  SettingsPanelModel,
  SettingsPanelProviderContext,
} from "@tabora/plugin-api"
import { settingsPanelModelSchema } from "@tabora/plugin-api"
import {
  createSettingsNavigator,
  filterSettingsPanelsBySurface,
  SETTINGS_SECTIONS,
} from "@tabora/orchestrator"
import type { SettingsSectionId } from "@tabora/orchestrator"
import { Button, IconButton } from "@tabora/ui/button"
import { Dialog } from "@tabora/ui/dialog"
import { EmptyState } from "@tabora/ui/empty-state"
import { InlineError } from "@tabora/ui/inline-error"
import { AccountSettingsNavigation } from "../AccountSettingsNavigation"
import { createPluginErrorFallback, PluginViewBoundary } from "../PluginViewBoundary"
import { SettingsSchemaRenderer } from "../settingsSchema"
import { MobileSettingsHeader } from "../MobileSettingsHeader"
import { MobileSettingsIndex } from "../mobileSettings"
import type { SettingsHostProps, SettingsPanelDescriptor } from "./types"
import { styles } from "./styles"
import {
  SECTION_FALLBACK_DESCRIPTIONS,
  WORKSPACE_SECTION_IDS,
  EXTENSION_SECTION_IDS,
} from "./constants"

export function SettingsHost(props: SettingsHostProps) {
  const navigablePanels = () =>
    filterSettingsPanelsBySurface(props.panels, props.surface).filter(
      (panel) => panel.scope !== "instance" || Boolean(props.instanceId),
    )
  const navigator = () => createSettingsNavigator(navigablePanels(), props.surface)

  const [statusText, setStatusText] = createSignal<string | null>(null)
  const [accountNavigation, setAccountNavigation] = createSignal<SettingsPanelNavigation | null>(
    null,
  )

  const handleClose = () => {
    setStatusText(null)
    props.onClose()
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

  const settingsProviderContext = (
    panel: SettingsPanelDescriptor,
    signal?: AbortSignal,
  ): SettingsPanelProviderContext => ({
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
      ...(panel.scope === "instance" && props.instanceId ? { instanceId: props.instanceId } : {}),
    },
    ...(signal ? { signal } : {}),
  })

  createEffect(() => {
    if (props.surface !== "desktop" || activeSection() === "account") return

    const accountPanel = navigator().sections.account.panels.find(
      (panel) => panel.content.kind === "schema",
    )
    setAccountNavigation(null)
    if (!accountPanel || accountPanel.content.kind !== "schema") return

    const provider = props.getSettingsProvider(accountPanel.content.provider)
    if (!provider) return

    const controller = new AbortController()
    onCleanup(() => controller.abort())
    void Promise.resolve(
      provider.getModel(settingsProviderContext(accountPanel, controller.signal)),
    )
      .then((model) => {
        if (controller.signal.aborted) return
        const parsed = settingsPanelModelSchema.safeParse(model)
        if (parsed.success) {
          const settingsModel = parsed.data as SettingsPanelModel
          setAccountNavigation(settingsModel.navigation ?? null)
        }
      })
      .catch(() => {
        // 账号插件加载失败时保持本地模式，不阻塞其他设置页面。
      })
  })

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

  const renderSettingsWindow = () => (
    <div
      {...stylex.attrs(props.surface === "mobile" ? styles.mobilePageWindow : styles.content)}
      data-settings-window
      data-settings-surface={props.surface}
      {...(props.surface === "desktop" ? { "data-workbench-overlay": "settings" } : {})}
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
                                context={settingsProviderContext(panel)}
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
            <Button variant="primary" onClick={handleClose}>
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
      onClose={handleClose}
      {...(props.copy?.backAriaLabel ? { backAriaLabel: props.copy.backAriaLabel } : {})}
    />
  )

  return (
    <Show
      when={props.surface === "mobile"}
      fallback={
        // 桌面分支常驻组件树，open/close 生命周期与进出场动画交给 Dialog（kobalte
        // presence）管理；关闭时 renderSettingsWindow 作为惰性 children 不会被挂载。
        <Dialog
          open={props.open}
          onCancel={handleClose}
          // Settings has an explicit close action; backdrop interaction must not tear down
          // the host while a plugin opens a secondary dialog in a portal.
          maskClosable={false}
          chromeless
          width={null}
          ariaLabel={props.copy?.sidebarTitle ?? "设置"}
        >
          {renderSettingsWindow()}
        </Dialog>
      }
    >
      <Show when={props.open}>
        <Show
          when={props.showIndex}
          fallback={
            <main
              {...stylex.attrs(styles.mobilePage)}
              data-settings-page
              data-settings-surface="mobile"
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
