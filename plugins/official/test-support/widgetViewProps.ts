import { vi } from "vitest"
import type { WidgetViewProps } from "../../../packages/plugin-api/src/sdk"

type WidgetViewPropsOverrides = Omit<Partial<WidgetViewProps>, "data" | "host">

type WidgetViewPropsOptions = WidgetViewPropsOverrides & {
  data?: Partial<WidgetViewProps["data"]>
  host?: Partial<WidgetViewProps["host"]>
}

export function makeWidgetViewProps(overrides: WidgetViewPropsOptions = {}): WidgetViewProps {
  const baseHost: WidgetViewProps["host"] = {
    updateConfig: vi.fn().mockResolvedValue(undefined),
    removeInstance: vi.fn().mockResolvedValue(undefined),
    requestResize: vi.fn().mockResolvedValue(undefined),
    openModal: vi.fn(),
    closeModal: vi.fn(),
    openExpand: vi.fn(),
    showToast: vi.fn(),
    openExternal: vi.fn().mockResolvedValue(true),
  }
  const { data: dataOverrides, host: hostOverrides, ...props } = overrides
  return {
    instanceId: "widget-test-1",
    pluginId: "official.widgets.test",
    contributionId: "test",
    size: "M",
    supportedSizes: ["S", "M", "L", "XL"],
    config: {},
    data: {
      get: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
      ...dataOverrides,
    },
    host: { ...baseHost, ...hostOverrides },
    ...props,
  }
}
