import type { PluginInstance, WidgetContribution, WidgetViewProps } from "@tabora/plugin-api"

import type { ShellTranslation } from "../i18n"
import type { WidgetRenderModel } from "../shared/shellHelpers"

export type WorkbenchExpandState = {
  instanceId: string
  title: string
  viewId: string
  footerViewId?: string
  mode: "expand" | "settings"
  props: WidgetViewProps
}

type WidgetViewLookup = (viewId: string) => boolean

type WorkbenchExpandBuildOptions = {
  instance: PluginInstance
  model: WidgetRenderModel | null
  widget: Pick<WidgetContribution, "views"> | undefined
  hasView: WidgetViewLookup
  buildWidgetViewProps: (instance: PluginInstance, model: WidgetRenderModel) => WidgetViewProps
  tShell?: ShellTranslation
}

type WorkbenchExpandResult = {
  expandState: WorkbenchExpandState | null
  errorMessage: string | null
}

type WorkbenchExpandTarget = Omit<WorkbenchExpandState, "instanceId" | "props">

function buildWorkbenchWidgetOverlayState(
  options: WorkbenchExpandBuildOptions,
  resolveTarget: (model: WidgetRenderModel) => WorkbenchExpandTarget | null,
  getUnsupportedMessage: (model: WidgetRenderModel) => string,
): WorkbenchExpandResult {
  if (!options.model) {
    return {
      expandState: null,
      errorMessage: options.tShell
        ? options.tShell("placeholders.widgetInstanceInvalid", { instanceId: options.instance.id })
        : `卡片实例无效：${options.instance.id}`,
    }
  }

  const target = resolveTarget(options.model)
  if (!target) {
    return { expandState: null, errorMessage: getUnsupportedMessage(options.model) }
  }

  return {
    expandState: {
      instanceId: options.instance.id,
      ...target,
      props: options.buildWidgetViewProps(options.instance, options.model),
    },
    errorMessage: null,
  }
}

export function isWorkbenchInteractiveElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.closest("[data-allow-expand='true']")) {
    return false
  }

  return (
    target.closest(
      "button, input, textarea, select, a, [role='button'], [data-prevent-expand='true']",
    ) !== null
  )
}

export function resolveWorkbenchExpandView(
  widget: Pick<WidgetContribution, "views"> | undefined,
  hasView: WidgetViewLookup,
): { viewId: string; mode: "expand" } | null {
  if (!widget) return null
  if (widget.views.expand && hasView(widget.views.expand)) {
    return { viewId: widget.views.expand, mode: "expand" }
  }
  if (hasView(widget.views.card)) {
    return { viewId: widget.views.card, mode: "expand" }
  }
  return null
}

// 仅在声明了 expand 主体视图、且 expandFooter 已注册时返回 footer view id；
// 否则返回 null，宿主不渲染 footer。
export function resolveWorkbenchExpandFooterView(
  widget: Pick<WidgetContribution, "views"> | undefined,
  hasView: WidgetViewLookup,
): string | null {
  if (!widget) return null
  if (!widget.views.expand) return null
  const footerViewId = widget.views.expandFooter
  if (!footerViewId) return null
  return hasView(footerViewId) ? footerViewId : null
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
  return buildWorkbenchWidgetOverlayState(
    options,
    (model) => {
      const target = resolveWorkbenchExpandView(options.widget, options.hasView)
      if (!target) return null
      const footerViewId = resolveWorkbenchExpandFooterView(options.widget, options.hasView)
      return {
        title: model.title,
        viewId: target.viewId,
        ...(footerViewId ? { footerViewId } : {}),
        mode: target.mode,
      }
    },
    (model) =>
      options.tShell
        ? options.tShell("widget.expandNotSupported", { title: model.title })
        : `当前卡片暂不支持展开：${model.title}`,
  )
}

export function buildWorkbenchWidgetInstanceSettingsState(
  options: WorkbenchExpandBuildOptions,
): WorkbenchExpandResult {
  return buildWorkbenchWidgetOverlayState(
    options,
    (model) => {
      const viewId = resolveWorkbenchInstanceSettingsView(options.widget, options.hasView)
      if (!viewId) return null
      return {
        title: options.tShell
          ? options.tShell("widget.instanceSettings.title", { title: model.title })
          : `${model.title} 设置`,
        viewId,
        mode: "settings",
      }
    },
    (model) =>
      options.tShell
        ? options.tShell("widget.instanceSettingsNotSupported", { title: model.title })
        : `当前卡片暂不支持实例设置：${model.title}`,
  )
}
