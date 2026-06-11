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

import { SafeWorkbenchLayout } from "../surface/WorkbenchShellChrome"

type LayoutViewComponent = (props: LayoutViewProps<JSX.Element>) => JSX.Element
type SafeLayoutProps = Parameters<typeof SafeWorkbenchLayout>[0]
export type WorkbenchSafeLayoutOptions = Omit<SafeLayoutProps, "instances" | "isDark"> & {
  isDark: () => boolean
  instances: () => PluginInstance[]
}
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
  failedLayoutId?: () => string | null
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
  safeLayout: WorkbenchSafeLayoutOptions
}) {
  function renderSafeLayout() {
    const { isDark, instances, ...rest } = options.safeLayout
    return (
      <WorkbenchDndProvider dndKit={options.dndKit}>
        <SafeWorkbenchLayout {...rest} isDark={isDark()} instances={instances()} />
      </WorkbenchDndProvider>
    )
  }

  function renderActiveLayout() {
    if (options.failedLayoutId?.() === options.activeLayoutId()) {
      return renderSafeLayout()
    }

    const layout = options.findLayoutContribution(options.activeLayoutId())
    const LayoutView = layout?.view ? options.resolveLayoutView(layout.view) : undefined

    if (!LayoutView) {
      return renderSafeLayout()
    }

    options.clearLayoutError()

    const regions = options.buildRegionSlots(options.activeLayoutId(), options.displayedInstances())
    const host = options.buildHostAPI()

    return (
      <WorkbenchDndProvider dndKit={options.dndKit}>
        <LayoutBoundary
          fallback={renderSafeLayout()}
          onError={(error) => {
            console.error("Layout error:", error)
            options.recordLayoutError(options.activeLayoutId(), error)
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
    renderSafeLayout,
    renderActiveLayout,
  }
}
