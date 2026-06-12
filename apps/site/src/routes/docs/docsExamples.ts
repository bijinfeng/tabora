import type { JSX } from "solid-js"

import buttonDisabledFullMarkdown from "../../../../../packages/ui/src/component-docs/examples/button/button-disabled-full.md?raw"
import buttonGroupIconMarkdown from "../../../../../packages/ui/src/component-docs/examples/button/button-group-icon.md?raw"
import buttonSizesMarkdown from "../../../../../packages/ui/src/component-docs/examples/button/button-sizes.md?raw"
import buttonVariantsMarkdown from "../../../../../packages/ui/src/component-docs/examples/button/button-variants.md?raw"
import checkboxGroupedMarkdown from "../../../../../packages/ui/src/component-docs/examples/checkbox/checkbox-grouped.md?raw"
import checkboxStatesMarkdown from "../../../../../packages/ui/src/component-docs/examples/checkbox/checkbox-states.md?raw"
import radioHorizontalDisabledMarkdown from "../../../../../packages/ui/src/component-docs/examples/radio/radio-horizontal-disabled.md?raw"
import radioVerticalMarkdown from "../../../../../packages/ui/src/component-docs/examples/radio/radio-vertical.md?raw"
import selectBaseSizesMarkdown from "../../../../../packages/ui/src/component-docs/examples/select/select-base-sizes.md?raw"
import selectGroupsDisabledMarkdown from "../../../../../packages/ui/src/component-docs/examples/select/select-groups-disabled.md?raw"
import switchSettingsPanelMarkdown from "../../../../../packages/ui/src/component-docs/examples/switch/switch-settings-panel.md?raw"
import switchStatesSizesMarkdown from "../../../../../packages/ui/src/component-docs/examples/switch/switch-states-sizes.md?raw"

export type DocsExampleId =
  | "button.variants"
  | "button.sizes"
  | "button.disabled-full"
  | "button.group-icon"
  | "checkbox.states"
  | "checkbox.grouped"
  | "switch.states-sizes"
  | "switch.settings-panel"
  | "radio.vertical"
  | "radio.horizontal-disabled"
  | "select.base-sizes"
  | "select.groups-disabled"

export type DocsExample = {
  language: "html"
  source: string
  render: () => JSX.Element
}

const extractCodeFence = (markdown: string) => {
  const match = markdown.match(/```html\r?\n([\s\S]*?)\r?\n```/)
  const code = match?.[1]
  return code ? code.trim() : markdown.trim()
}

const htmlExample = (source: string): DocsExample => ({
  language: "html",
  source,
  render: () => {
    const wrapper = document.createElement("div")
    wrapper.innerHTML = source
    return wrapper as unknown as JSX.Element
  },
})

const docsExamples: Record<DocsExampleId, DocsExample> = {
  "button.variants": htmlExample(extractCodeFence(buttonVariantsMarkdown)),
  "button.sizes": htmlExample(extractCodeFence(buttonSizesMarkdown)),
  "button.disabled-full": htmlExample(extractCodeFence(buttonDisabledFullMarkdown)),
  "button.group-icon": htmlExample(extractCodeFence(buttonGroupIconMarkdown)),
  "checkbox.states": htmlExample(extractCodeFence(checkboxStatesMarkdown)),
  "checkbox.grouped": htmlExample(extractCodeFence(checkboxGroupedMarkdown)),
  "switch.states-sizes": htmlExample(extractCodeFence(switchStatesSizesMarkdown)),
  "switch.settings-panel": htmlExample(extractCodeFence(switchSettingsPanelMarkdown)),
  "radio.vertical": htmlExample(extractCodeFence(radioVerticalMarkdown)),
  "radio.horizontal-disabled": htmlExample(extractCodeFence(radioHorizontalDisabledMarkdown)),
  "select.base-sizes": htmlExample(extractCodeFence(selectBaseSizesMarkdown)),
  "select.groups-disabled": htmlExample(extractCodeFence(selectGroupsDisabledMarkdown)),
}

export function getDocsExample(id: DocsExampleId) {
  return docsExamples[id]
}
