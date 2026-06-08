import type { PluginInstance, WidgetSize, WidgetViewProps } from "@tabora/plugin-api"
import type { ToastOptions } from "@tabora/orchestrator"
import type { JSX } from "solid-js"

import type { WidgetRenderModel } from "./shellHelpers"

export type WorkbenchView<Props = Record<string, unknown>> = (props: Props) => JSX.Element

type ViewRegistry = Pick<Map<string, unknown>, "has" | "get">

type ScopedPluginDataRepository = {
  getByInstance<T>(pluginId: string, instanceId: string, key: string): Promise<T | undefined>
  saveForInstance<T>(pluginId: string, instanceId: string, key: string, value: T): Promise<void>
}

type BuildWorkbenchWidgetViewPropsOptions = {
  instance: PluginInstance
  model: WidgetRenderModel
  pluginDataRepo: ScopedPluginDataRepository
  saveInstance: (instance: PluginInstance) => Promise<void>
  setInstances: (
    updater: (instances: PluginInstance[]) => PluginInstance[],
  ) => PluginInstance[] | void
  removeWidget: (instanceId: string) => Promise<void>
  changeWidgetSize: (instanceId: string, size: WidgetSize) => Promise<void>
  setModalViewId: (viewId: string | null) => void
  setModalProps: (props: Record<string, unknown>) => void
  openWidgetExpand: (instance: PluginInstance) => void
  showToast: (message: string, options?: ToastOptions) => void
  openExternalForPlugin: (pluginId: string, url: string) => Promise<boolean> | boolean
}

export function createWorkbenchScopedData(options: {
  pluginId: string
  instanceId: string
  pluginDataRepo: ScopedPluginDataRepository
}): WidgetViewProps["data"] {
  return {
    get<T>(key: string): Promise<T | undefined> {
      return options.pluginDataRepo.getByInstance<T>(options.pluginId, options.instanceId, key)
    },
    save<T>(key: string, value: T): Promise<void> {
      return options.pluginDataRepo.saveForInstance<T>(
        options.pluginId,
        options.instanceId,
        key,
        value,
      )
    },
  }
}

export function resolveWorkbenchView<Props = Record<string, unknown>>(
  views: ViewRegistry,
  viewId: string,
): WorkbenchView<Props> | undefined {
  return views.has(viewId) ? (views.get(viewId) as WorkbenchView<Props>) : undefined
}

export function buildWorkbenchWidgetViewProps(
  options: BuildWorkbenchWidgetViewPropsOptions,
): WidgetViewProps {
  return {
    instanceId: options.instance.id,
    pluginId: options.instance.pluginId,
    contributionId: options.instance.contributionId,
    size: options.model.currentSize,
    supportedSizes: options.model.supportedSizes,
    config: options.instance.config,
    data: createWorkbenchScopedData({
      pluginId: options.instance.pluginId,
      instanceId: options.instance.id,
      pluginDataRepo: options.pluginDataRepo,
    }),
    host: {
      async updateConfig(value) {
        const updated: PluginInstance = {
          ...options.instance,
          config: value,
          updatedAt: new Date().toISOString(),
        }
        await options.saveInstance(updated)
        options.setInstances((instances) =>
          instances.map((instance) => (instance.id === options.instance.id ? updated : instance)),
        )
      },
      async removeInstance() {
        await options.removeWidget(options.instance.id)
      },
      async requestResize(size) {
        await options.changeWidgetSize(options.instance.id, size)
      },
      openModal(viewId, props) {
        options.setModalViewId(viewId)
        options.setModalProps({
          ...(typeof props === "object" && props !== null
            ? (props as Record<string, unknown>)
            : {}),
          pluginId: options.instance.pluginId,
        })
      },
      closeModal() {
        options.setModalViewId(null)
      },
      openExpand() {
        options.openWidgetExpand(options.instance)
      },
      showToast(message, toastOptions) {
        options.showToast(message, toastOptions)
      },
      async openExternal(url) {
        return options.openExternalForPlugin(options.instance.pluginId, url)
      },
    },
  }
}
