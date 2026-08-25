import type { DragDropProviderProps } from "@dnd-kit/solid"
import { DragDropProvider } from "@dnd-kit/solid"
import type { LayoutHostAPI, PluginInstance } from "@tabora/plugin-api"
import { LayoutBoundary } from "@tabora/workbench-shell"
import type { JSX } from "solid-js"
import { DashboardLayout } from "../surface/dashboard/dashboard-layout"
import { LayoutUnavailableState } from "../surface/WorkbenchShellChrome"
import type { LayoutErrorStatus } from "./layoutError"
import type { InstanceRenderer } from "../shell/WorkbenchShellInstanceRenderer"

type WorkbenchDndKitOptions = Required<
  Pick<DragDropProviderProps, "onDragStart" | "onDragMove" | "onDragOver" | "onDragEnd">
>

function WorkbenchDndProvider(props: {
  dndKit: WorkbenchDndKitOptions | undefined
  children: JSX.Element
}) {
  if (!props.dndKit) {
    return <>{props.children}</>
  }

  return (
    <DragDropProvider
      onDragStart={props.dndKit.onDragStart}
      onDragMove={props.dndKit.onDragMove}
      onDragOver={props.dndKit.onDragOver}
      onDragEnd={props.dndKit.onDragEnd}
    >
      {props.children}
    </DragDropProvider>
  )
}

export function createWorkbenchLayoutRenderer(options: {
  activeLayoutId: () => string
  layoutError: () => LayoutErrorStatus | null
  displayedInstances: () => PluginInstance[]
  instanceRenderer: InstanceRenderer
  layoutHostAPI: LayoutHostAPI
  isMobile: () => boolean
  clearLayoutError: () => void
  recordLayoutError: (layoutId: string, error: unknown) => void
  dndKit?: WorkbenchDndKitOptions
}) {
  function renderUnavailable(status: LayoutErrorStatus) {
    return <LayoutUnavailableState layoutId={status.layoutId} message={status.message} />
  }

  function renderActiveLayout() {
    const layoutId = options.activeLayoutId()
    const layoutError = options.layoutError()
    if (layoutError?.layoutId === layoutId) {
      return renderUnavailable(layoutError)
    }

    options.clearLayoutError()

    const instances = options.displayedInstances()
    const searchInstances = instances.filter((inst) => inst.contribution.kind === "search")
    const widgetInstances = instances.filter((inst) => inst.contribution.kind === "widget")

    // Read synchronously so this memo tracks the responsive breakpoint and remounts
    // the dashboard when it flips. Passing the value (not the call) keeps it a static
    // prop rather than a lazy getter the untracked component body would freeze.
    const isMobile = options.isMobile()

    return (
      <WorkbenchDndProvider dndKit={options.dndKit}>
        <LayoutBoundary
          fallback={
            <LayoutUnavailableState
              layoutId={layoutId}
              message="布局渲染失败，正在记录具体错误。"
            />
          }
          onError={(error) => {
            console.error("Layout error:", error)
            options.recordLayoutError(layoutId, error)
          }}
        >
          <DashboardLayout
            searchInstances={searchInstances}
            widgetInstances={widgetInstances}
            isMobile={isMobile}
            host={options.layoutHostAPI}
            renderSearch={options.instanceRenderer.renderSearch}
            renderWidget={options.instanceRenderer.renderWidget}
          />
        </LayoutBoundary>
      </WorkbenchDndProvider>
    )
  }

  return {
    renderActiveLayout,
  }
}
