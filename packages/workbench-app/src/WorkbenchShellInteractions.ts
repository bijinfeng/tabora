import type { PluginInstance, WidgetContribution, WidgetViewProps } from "@tabora/plugin-api"

import type { WidgetRenderModel } from "./shellHelpers"

export type WorkbenchExpandState = {
  instanceId: string
  title: string
  viewId: string
  mode: "card" | "modal" | "fullscreen" | "settings"
  props: WidgetViewProps
}

type WidgetViewLookup = (viewId: string) => boolean

type WorkbenchExpandBuildOptions = {
  instance: PluginInstance
  model: WidgetRenderModel | null
  widget: Pick<WidgetContribution, "views"> | undefined
  hasView: WidgetViewLookup
  buildWidgetViewProps: (instance: PluginInstance, model: WidgetRenderModel) => WidgetViewProps
}

type WorkbenchExpandResult = {
  expandState: WorkbenchExpandState | null
  errorMessage: string | null
}

export function isWorkbenchInteractiveElement(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest(
      "button, input, textarea, select, a, [role='button'], [data-prevent-expand='true']",
    ) !== null
  )
}

export function resolveWorkbenchExpandView(
  widget: Pick<WidgetContribution, "views"> | undefined,
  hasView: WidgetViewLookup,
): { viewId: string; mode: "card" | "modal" | "fullscreen" } | null {
  if (!widget) return null
  if (widget.views.fullscreen && hasView(widget.views.fullscreen)) {
    return { viewId: widget.views.fullscreen, mode: "fullscreen" }
  }
  if (widget.views.modal && hasView(widget.views.modal)) {
    return { viewId: widget.views.modal, mode: "modal" }
  }
  if (hasView(widget.views.card)) {
    return { viewId: widget.views.card, mode: "card" }
  }
  return null
}

export function resolveWorkbenchInstanceSettingsView(
  widget: Pick<WidgetContribution, "views"> | undefined,
  hasView: WidgetViewLookup,
): string | null {
  const settingsViewId = widget?.views.settings
  if (!settingsViewId) return null
  return hasView(settingsViewId) ? settingsViewId : null
}

export function buildWorkbenchWidgetExpandState(
  options: WorkbenchExpandBuildOptions,
): WorkbenchExpandResult {
  if (!options.model) {
    return {
      expandState: null,
      errorMessage: `卡片实例无效：${options.instance.id}`,
    }
  }

  const target = resolveWorkbenchExpandView(options.widget, options.hasView)
  if (!target) {
    return {
      expandState: null,
      errorMessage: `当前卡片暂不支持展开：${options.model.title}`,
    }
  }

  return {
    expandState: {
      instanceId: options.instance.id,
      title: options.model.title,
      viewId: target.viewId,
      mode: target.mode,
      props: options.buildWidgetViewProps(options.instance, options.model),
    },
    errorMessage: null,
  }
}

export function buildWorkbenchWidgetInstanceSettingsState(
  options: WorkbenchExpandBuildOptions,
): WorkbenchExpandResult {
  if (!options.model) {
    return {
      expandState: null,
      errorMessage: `卡片实例无效：${options.instance.id}`,
    }
  }

  const viewId = resolveWorkbenchInstanceSettingsView(options.widget, options.hasView)
  if (!viewId) {
    return {
      expandState: null,
      errorMessage: `当前卡片暂不支持实例设置：${options.model.title}`,
    }
  }

  return {
    expandState: {
      instanceId: options.instance.id,
      title: `${options.model.title} 设置`,
      viewId,
      mode: "settings",
      props: options.buildWidgetViewProps(options.instance, options.model),
    },
    errorMessage: null,
  }
}
