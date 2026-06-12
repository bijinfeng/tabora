import { Suspense, lazy, type JSX } from "solid-js"

import badgeDemoSource from "../../../../../packages/ui/src/styled/badge/badge.demo.tsx?raw"
import buttonDemoSource from "../../../../../packages/ui/src/styled/button/button.demo.tsx?raw"
import cardSectionDemoSource from "../../../../../packages/ui/src/styled/cardSection/cardSection.demo.tsx?raw"
import checkboxDemoSource from "../../../../../packages/ui/src/styled/checkbox/checkbox.demo.tsx?raw"
import dialogDemoSource from "../../../../../packages/ui/src/styled/dialog/dialog.demo.tsx?raw"
import drawerDemoSource from "../../../../../packages/ui/src/styled/drawer/drawer.demo.tsx?raw"
import emptyStateDemoSource from "../../../../../packages/ui/src/styled/emptyState/emptyState.demo.tsx?raw"
import inputDemoSource from "../../../../../packages/ui/src/styled/input/input.demo.tsx?raw"
import progressDemoSource from "../../../../../packages/ui/src/styled/progress/progress.demo.tsx?raw"
import radioGroupDemoSource from "../../../../../packages/ui/src/styled/radioGroup/radioGroup.demo.tsx?raw"
import selectDemoSource from "../../../../../packages/ui/src/styled/select/select.demo.tsx?raw"
import skeletonDemoSource from "../../../../../packages/ui/src/styled/skeleton/skeleton.demo.tsx?raw"
import switchDemoSource from "../../../../../packages/ui/src/styled/switch/switch.demo.tsx?raw"
import tableDemoSource from "../../../../../packages/ui/src/styled/table/table.demo.tsx?raw"
import tabsDemoSource from "../../../../../packages/ui/src/styled/tabs/tabs.demo.tsx?raw"
import textareaDemoSource from "../../../../../packages/ui/src/styled/textarea/textarea.demo.tsx?raw"
import toastDemoSource from "../../../../../packages/ui/src/styled/toast/toast.demo.tsx?raw"
import tooltipDemoSource from "../../../../../packages/ui/src/styled/tooltip/tooltip.demo.tsx?raw"

const BadgeDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/badge/badge.demo").then((module) => ({
    default: module.BadgeDemo,
  })),
)

const ButtonDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/button/button.demo").then((module) => ({
    default: module.ButtonDemo,
  })),
)

const CardSectionDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/cardSection/cardSection.demo").then((module) => ({
    default: module.CardSectionDemo,
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

const DialogDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/dialog/dialog.demo").then((module) => ({
    default: module.DialogDemo,
  })),
)

const DrawerDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/drawer/drawer.demo").then((module) => ({
    default: module.DrawerDemo,
  })),
)

const EmptyStateDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/emptyState/emptyState.demo").then((module) => ({
    default: module.EmptyStateDemo,
  })),
)

const ProgressDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/progress/progress.demo").then((module) => ({
    default: module.ProgressDemo,
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

const SkeletonDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/skeleton/skeleton.demo").then((module) => ({
    default: module.SkeletonDemo,
  })),
)

const TableDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/table/table.demo").then((module) => ({
    default: module.TableDemo,
  })),
)

const TabsDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/tabs/tabs.demo").then((module) => ({
    default: module.TabsDemo,
  })),
)

const ToastDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/toast/toast.demo").then((module) => ({
    default: module.ToastDemo,
  })),
)

const TooltipDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/tooltip/tooltip.demo").then((module) => ({
    default: module.TooltipDemo,
  })),
)

export type DocsExampleId =
  | "badge"
  | "button"
  | "card"
  | "dialog"
  | "drawer"
  | "empty"
  | "input"
  | "progress"
  | "textarea"
  | "select"
  | "checkbox"
  | "switch"
  | "radio"
  | "skeleton"
  | "table"
  | "tabs"
  | "toast"
  | "tooltip"

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
  badge: componentExample(badgeDemoSource, () => (
    <Suspense fallback={null}>
      <BadgeDemo />
    </Suspense>
  )),
  button: componentExample(buttonDemoSource, () => (
    <Suspense fallback={null}>
      <ButtonDemo />
    </Suspense>
  )),
  card: componentExample(cardSectionDemoSource, () => (
    <Suspense fallback={null}>
      <CardSectionDemo />
    </Suspense>
  )),
  dialog: componentExample(dialogDemoSource, () => (
    <Suspense fallback={null}>
      <DialogDemo />
    </Suspense>
  )),
  drawer: componentExample(drawerDemoSource, () => (
    <Suspense fallback={null}>
      <DrawerDemo />
    </Suspense>
  )),
  empty: componentExample(emptyStateDemoSource, () => (
    <Suspense fallback={null}>
      <EmptyStateDemo />
    </Suspense>
  )),
  input: componentExample(inputDemoSource, () => (
    <Suspense fallback={null}>
      <InputDemo />
    </Suspense>
  )),
  progress: componentExample(progressDemoSource, () => (
    <Suspense fallback={null}>
      <ProgressDemo />
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
  skeleton: componentExample(skeletonDemoSource, () => (
    <Suspense fallback={null}>
      <SkeletonDemo />
    </Suspense>
  )),
  table: componentExample(tableDemoSource, () => (
    <Suspense fallback={null}>
      <TableDemo />
    </Suspense>
  )),
  tabs: componentExample(tabsDemoSource, () => (
    <Suspense fallback={null}>
      <TabsDemo />
    </Suspense>
  )),
  toast: componentExample(toastDemoSource, () => (
    <Suspense fallback={null}>
      <ToastDemo />
    </Suspense>
  )),
  tooltip: componentExample(tooltipDemoSource, () => (
    <Suspense fallback={null}>
      <TooltipDemo />
    </Suspense>
  )),
}

export function getDocsExample(id: DocsExampleId) {
  return docsExamples[id]
}
