import type { LayoutViewProps } from "@tabora/plugin-api"

export type LayoutI18n = {
  locale(): string
  t(key: string, vars?: Record<string, string | number>): string
  registerMessages(bundles: Array<{ locale: string; messages: Record<string, string> }>): void
}

export type LayoutViewPropsWithI18n<T> = LayoutViewProps<T> & { i18n?: LayoutI18n }

export type RailGroup = {
  id: string
  name: string
  icon: string
  isDefault: boolean
  widgets: string[]
}

export type DashboardLayoutState = {
  groups: RailGroup[]
  activeGroupId: string
}

export type RailGroupSetter = (
  value: RailGroup[] | ((previous: RailGroup[]) => RailGroup[]),
) => RailGroup[]

export type ActiveGroupSetter = (value: string | ((previous: string) => string)) => string

export type RailGroupContextMenu = {
  groupId: string
  x: number
  y: number
}
