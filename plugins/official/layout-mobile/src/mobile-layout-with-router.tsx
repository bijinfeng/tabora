import { Router, Route, useNavigate, useLocation } from "@solidjs/router"
import { createSignal, Show } from "solid-js"
import type { LayoutViewProps } from "@tabora/plugin-api/sdk"
import type { JSX } from "solid-js"

import { MobileLayout } from "./mobile-layout"
import { MobileSettingsPage, type SettingsPanelDescriptor } from "./mobile-settings-page"
import type { LayoutI18n } from "./mobile-layout"

export type MobileLayoutWithRouterProps = LayoutViewProps<JSX.Element> & { i18n?: LayoutI18n }

function MobileLayoutRoutes(props: MobileLayoutWithRouterProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeSectionId, setActiveSectionId] = createSignal<string | null>(null)

  const isSettingsRoute = () => location.pathname.startsWith("/settings")

  // 获取设置面板列表（从 workbench API）
  const getSettingsPanels = (): SettingsPanelDescriptor[] => {
    // TODO: 从 host 或 context 获取实际的设置面板
    // 目前返回占位数据
    return [
      {
        id: "general",
        pluginId: "official.settings",
        label: "通用",
        title: "通用设置",
        scope: "global",
        sectionId: "general",
        content: { kind: "view", view: "official.settings.general.view" },
      },
      {
        id: "appearance",
        pluginId: "official.settings",
        label: "外观",
        title: "外观设置",
        scope: "global",
        sectionId: "appearance",
        content: { kind: "view", view: "official.settings.appearance.view" },
      },
      {
        id: "search",
        pluginId: "official.settings",
        label: "搜索",
        title: "搜索设置",
        scope: "global",
        sectionId: "search",
        content: { kind: "view", view: "official.settings.search.view" },
      },
      {
        id: "plugins",
        pluginId: "official.settings",
        label: "插件",
        title: "插件管理",
        scope: "global",
        sectionId: "plugins",
        content: { kind: "view", view: "official.settings.plugins.view" },
      },
      {
        id: "about",
        pluginId: "official.settings",
        label: "关于",
        title: "关于 Tabora",
        scope: "global",
        sectionId: "about",
        content: { kind: "view", view: "official.settings.about.view" },
      },
    ]
  }

  // 当在设置路由时，不渲染原始布局
  return (
    <>
      <Show when={!isSettingsRoute()}>
        <MobileLayout {...props} onNavigateToSettings={() => navigate("/settings")} />
      </Show>
      <Route
        path="/settings"
        component={() => (
          <MobileSettingsPage
            host={props.host}
            panels={getSettingsPanels()}
            activeSectionId={activeSectionId()}
            onBack={() => navigate("/")}
            onSectionChange={(sectionId) => {
              setActiveSectionId(sectionId)
              navigate(`/settings/${sectionId}`)
            }}
          />
        )}
      />
      <Route
        path="/settings/:sectionId"
        component={() => (
          <MobileSettingsPage
            host={props.host}
            panels={getSettingsPanels()}
            activeSectionId={activeSectionId()}
            onBack={() => {
              setActiveSectionId(null)
              navigate("/settings")
            }}
            onSectionChange={(sectionId) => {
              setActiveSectionId(sectionId)
              navigate(`/settings/${sectionId}`)
            }}
          />
        )}
      />
    </>
  )
}

export function MobileLayoutWithRouter(props: MobileLayoutWithRouterProps) {
  // 在测试环境中，直接渲染布局而不包裹路由
  // @ts-expect-error - VITEST 在测试环境中注入
  const isTest = typeof window === "undefined" || import.meta.env?.VITEST
  if (isTest) {
    return <MobileLayout {...props} />
  }

  return (
    <Router>
      <MobileLayoutRoutes {...props} />
    </Router>
  )
}
