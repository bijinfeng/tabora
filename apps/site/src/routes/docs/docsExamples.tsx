import { Suspense, lazy, type JSX } from "solid-js"

import buttonDemoSource from "../../../../../packages/ui/src/styled/button/button.demo.tsx?raw"
import checkboxDemoSource from "../../../../../packages/ui/src/styled/checkbox/checkbox.demo.tsx?raw"
import inputDemoSource from "../../../../../packages/ui/src/styled/input/input.demo.tsx?raw"
import radioGroupDemoSource from "../../../../../packages/ui/src/styled/radioGroup/radioGroup.demo.tsx?raw"
import selectDemoSource from "../../../../../packages/ui/src/styled/select/select.demo.tsx?raw"
import switchDemoSource from "../../../../../packages/ui/src/styled/switch/switch.demo.tsx?raw"
import textareaDemoSource from "../../../../../packages/ui/src/styled/textarea/textarea.demo.tsx?raw"

const ButtonDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/button/button.demo").then((module) => ({
    default: module.ButtonDemo,
  })),
)

const InputDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/input/input.demo").then((module) => ({
    default: module.InputDemo,
  })),
)

const TextareaDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/textarea/textarea.demo").then((module) => ({
    default: module.TextareaDemo,
  })),
)

const SelectDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/select/select.demo").then((module) => ({
    default: module.SelectDemo,
  })),
)

const CheckboxDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/checkbox/checkbox.demo").then((module) => ({
    default: module.CheckboxDemo,
  })),
)

const SwitchDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/switch/switch.demo").then((module) => ({
    default: module.SwitchDemo,
  })),
)

const RadioGroupDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/radioGroup/radioGroup.demo").then((module) => ({
    default: module.RadioGroupDemo,
  })),
)

export type DocsExampleId =
  | "button"
  | "input"
  | "textarea"
  | "select"
  | "checkbox"
  | "switch"
  | "radio"

export type DocsExample = {
  language: "tsx"
  source: string
  render: () => JSX.Element
}

const componentExample = (source: string, render: () => JSX.Element): DocsExample => ({
  language: "tsx",
  source,
  render: () => <div class="docs-render">{render()}</div>,
})

const docsExamples: Record<DocsExampleId, DocsExample> = {
  button: componentExample(buttonDemoSource, () => (
    <Suspense fallback={null}>
      <ButtonDemo />
    </Suspense>
  )),
  input: componentExample(inputDemoSource, () => (
    <Suspense fallback={null}>
      <InputDemo />
    </Suspense>
  )),
  textarea: componentExample(textareaDemoSource, () => (
    <Suspense fallback={null}>
      <TextareaDemo />
    </Suspense>
  )),
  select: componentExample(selectDemoSource, () => (
    <Suspense fallback={null}>
      <SelectDemo />
    </Suspense>
  )),
  checkbox: componentExample(checkboxDemoSource, () => (
    <Suspense fallback={null}>
      <CheckboxDemo />
    </Suspense>
  )),
  switch: componentExample(switchDemoSource, () => (
    <Suspense fallback={null}>
      <SwitchDemo />
    </Suspense>
  )),
  radio: componentExample(radioGroupDemoSource, () => (
    <Suspense fallback={null}>
      <RadioGroupDemo />
    </Suspense>
  )),
}

export function getDocsExample(id: DocsExampleId) {
  return docsExamples[id]
}
