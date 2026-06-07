import type { PluginInstance, WidgetContribution, WidgetViewProps } from "@tabora/plugin-api"
import { describe, expect, it } from "vitest"

import {
  buildWorkbenchWidgetExpandState,
  buildWorkbenchWidgetInstanceSettingsState,
  isWorkbenchInteractiveElement,
} from "./WorkbenchShellInteractions"
import type { WidgetRenderModel } from "./shellHelpers"

function instance(): PluginInstance {
  return {
    id: "widget-1",
    workspaceId: "workspace-1",
    pluginId: "plugin.widgets",
    contributionId: "widget.notes",
    extensionPoint: "widget",
    regionId: "mainGrid",
    enabled: true,
    size: "M",
    config: {},
    createdAt: "2026-06-06T00:00:00.000Z",
    updatedAt: "2026-06-06T00:00:00.000Z",
  }
}

function model(): WidgetRenderModel {
  return {
    title: "便签",
    icon: "pencil",
    currentSize: "M",
    supportedSizes: ["S", "M"],
  }
}

function widget(views: WidgetContribution["views"]): Pick<WidgetContribution, "views"> {
  return { views }
}

function props(): WidgetViewProps {
  return {
    instanceId: "widget-1",
    pluginId: "plugin.widgets",
    contributionId: "widget.notes",
    size: "M",
    supportedSizes: ["S", "M"],
    config: {},
    data: {
      get: async () => undefined,
      save: async () => {},
    },
    host: {
      updateConfig: async () => {},
      removeInstance: async () => {},
      requestResize: async () => {},
      openModal: () => {},
      closeModal: () => {},
      openExpand: () => {},
      showToast: () => {},
      openExternal: async () => false,
    },
  }
}

describe("isWorkbenchInteractiveElement", () => {
  it("treats interactive descendants as interactive targets", () => {
    const button = document.createElement("button")
    const span = document.createElement("span")
    button.append(span)

    expect(isWorkbenchInteractiveElement(span)).toBe(true)
    expect(isWorkbenchInteractiveElement(document.createElement("div"))).toBe(false)
  })
})

describe("buildWorkbenchWidgetExpandState", () => {
  it("uses the explicit expand view contract", () => {
    const viewProps = props()
    const result = buildWorkbenchWidgetExpandState({
      instance: instance(),
      model: model(),
      widget: widget({
        card: "widget.notes.card",
        expand: "widget.notes.expand",
      }),
      hasView: () => true,
      buildWidgetViewProps: () => viewProps,
    })

    expect(result).toEqual({
      expandState: {
        instanceId: "widget-1",
        title: "便签",
        viewId: "widget.notes.expand",
        mode: "expand",
        props: viewProps,
      },
      errorMessage: null,
    })
  })

  it("reports a localized error when the widget does not declare an expand view", () => {
    const viewProps = props()
    const result = buildWorkbenchWidgetExpandState({
      instance: instance(),
      model: model(),
      widget: widget({ card: "widget.notes.card" }),
      hasView: () => true,
      buildWidgetViewProps: () => viewProps,
    })

    expect(result).toEqual({
      expandState: null,
      errorMessage: "当前卡片暂不支持展开：便签",
    })
  })
})

describe("buildWorkbenchWidgetInstanceSettingsState", () => {
  it("returns a settings expand state when the widget exposes a registered settings view", () => {
    const viewProps = props()
    const result = buildWorkbenchWidgetInstanceSettingsState({
      instance: instance(),
      model: model(),
      widget: widget({
        card: "widget.notes.card",
        settings: "widget.notes.settings",
      }),
      hasView: () => true,
      buildWidgetViewProps: () => viewProps,
    })

    expect(result).toEqual({
      expandState: {
        instanceId: "widget-1",
        title: "便签 设置",
        viewId: "widget.notes.settings",
        mode: "settings",
        props: viewProps,
      },
      errorMessage: null,
    })
  })
})
