import type { WidgetSize } from "@tabora/plugin-api"
import type { JSX } from "solid-js"

export type SolidView<Props = Record<string, unknown>> = (props: Props) => JSX.Element

export type AvailableWidget = {
  pluginId: string
  id: string
  icon?: string
  title: string
  description?: string
  source?: "official" | "third-party"
  version?: string
  supportedSizes?: WidgetSize[]
  defaultSize?: WidgetSize
  pluginName?: string
}

export type WidgetContextSection = {
  items: Array<{
    label: string
    danger?: boolean
    isCurrent?: boolean
    run: () => void
  }>
}

export type SafeLayoutModel = {
  title: string
  icon?: string
  currentSize: WidgetSize
  supportedSizes: WidgetSize[]
}
