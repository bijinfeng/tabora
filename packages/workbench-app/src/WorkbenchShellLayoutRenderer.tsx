import type { JSX } from "solid-js"
import type {
  LayoutContribution,
  LayoutHostAPI,
  LayoutViewProps,
  PluginInstance,
  RegionSlot,
} from "@tabora/plugin-api"
import { LayoutBoundary } from "@tabora/workbench-shell"

import { SafeWorkbenchLayout } from "./WorkbenchShellChrome"

type LayoutViewComponent = (props: LayoutViewProps) => JSX.Element
type SafeLayoutProps = Parameters<typeof SafeWorkbenchLayout>[0]
export type WorkbenchSafeLayoutOptions = Omit<SafeLayoutProps, "instances" | "isDark"> & {
  isDark: () => boolean
  instances: () => PluginInstance[]
}

export function createWorkbenchLayoutRenderer(options: {
  activeLayoutId: () => string
  failedLayoutId?: () => string | null
  displayedInstances: () => PluginInstance[]
  findLayoutContribution: (layoutId: string) => LayoutContribution | undefined
  resolveLayoutView: (viewId: string) => LayoutViewComponent | undefined
  buildRegionSlots: (layoutId: string, instances: PluginInstance[]) => Record<string, RegionSlot>
  buildHostAPI: () => LayoutHostAPI
  isMobile: () => boolean
  clearLayoutError: () => void
  recordLayoutError: (layoutId: string, error: unknown) => void
  safeLayout: WorkbenchSafeLayoutOptions
}) {
  function renderSafeLayout() {
    const { isDark, instances, ...rest } = options.safeLayout
    return <SafeWorkbenchLayout {...rest} isDark={isDark()} instances={instances()} />
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
    )
  }

  return {
    renderSafeLayout,
    renderActiveLayout,
  }
}
