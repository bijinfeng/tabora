import type { JSX } from "solid-js"
import { DragDropProvider } from "@dnd-kit/solid"
import type { DragDropProviderProps } from "@dnd-kit/solid"
import type {
  LayoutContribution,
  LayoutHostAPI,
  LayoutViewProps,
  PluginInstance,
  RegionSlot,
} from "@tabora/plugin-api"
import { LayoutBoundary } from "@tabora/workbench-shell"

import { LayoutUnavailableState } from "../surface/WorkbenchShellChrome"
import type { LayoutErrorStatus } from "./layoutError"

type LayoutViewComponent = (props: LayoutViewProps<JSX.Element>) => JSX.Element
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
  findLayoutContribution: (layoutId: string) => LayoutContribution | undefined
  resolveLayoutView: (viewId: string) => LayoutViewComponent | undefined
  buildRegionSlots: (
    layoutId: string,
    instances: PluginInstance[],
  ) => Record<string, RegionSlot<JSX.Element>>
  buildHostAPI: () => LayoutHostAPI
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

    const layout = options.findLayoutContribution(layoutId)
    const LayoutView = layout?.view ? options.resolveLayoutView(layout.view) : undefined

    if (!LayoutView) {
      return renderUnavailable({
        layoutId,
        message: layout ? "布局插件未注册可渲染的 view" : "布局插件未注册",
      })
    }

    options.clearLayoutError()

    const regions = options.buildRegionSlots(layoutId, options.displayedInstances())
    const host = options.buildHostAPI()

    return (
      <WorkbenchDndProvider dndKit={options.dndKit}>
        <LayoutBoundary
          fallback={
            <LayoutUnavailableState
              layoutId={layoutId}
              message="布局插件渲染失败，正在记录具体错误。"
            />
          }
          onError={(error) => {
            console.error("Layout error:", error)
            options.recordLayoutError(layoutId, error)
          }}
        >
          {LayoutView({
            regions,
            isMobile: options.isMobile(),
            host,
          })}
        </LayoutBoundary>
      </WorkbenchDndProvider>
    )
  }

  return {
    renderActiveLayout,
  }
}
