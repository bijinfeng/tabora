import { Router, Route, useNavigate, useLocation } from "@solidjs/router"
import { createSignal, Show } from "solid-js"
import type { LayoutViewProps } from "@tabora/plugin-api/sdk"
import type { JSX } from "solid-js"

import { MobileLayout } from "./mobile-layout"
import { MobileSettingsPage } from "./mobile-settings-page"
import type { LayoutI18n } from "./mobile-layout"

export type MobileLayoutWithRouterProps = LayoutViewProps<JSX.Element> & { i18n?: LayoutI18n }

function MobileLayoutRoutes(props: MobileLayoutWithRouterProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeSectionId, setActiveSectionId] = createSignal<string | null>(null)

  const isSettingsRoute = () => location.pathname.startsWith("/settings")

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
            activeSectionId={activeSectionId()}
            onBack={() => navigate("/")}
            onSectionChange={(sectionId) => setActiveSectionId(sectionId)}
          />
        )}
      />
      <Route
        path="/settings/:sectionId"
        component={() => (
          <MobileSettingsPage
            host={props.host}
            activeSectionId={activeSectionId()}
            onBack={() => {
              if (activeSectionId()) {
                setActiveSectionId(null)
                navigate("/settings")
              } else {
                navigate("/")
              }
            }}
            onSectionChange={(sectionId) => setActiveSectionId(sectionId)}
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
