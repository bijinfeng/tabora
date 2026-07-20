import { Suspense, lazy, type Component, type JSX } from "solid-js"
import * as stylex from "@stylexjs/stylex"

import { sx } from "../../shared/stylex"
import accordionDemoSource from "../../../../../packages/ui/src/styled/accordion/accordion.demo.tsx?raw"
import avatarDemoSource from "../../../../../packages/ui/src/styled/avatar/avatar.demo.tsx?raw"
import badgeDemoSource from "../../../../../packages/ui/src/styled/badge/badge.demo.tsx?raw"
import breadcrumbDemoSource from "../../../../../packages/ui/src/styled/breadcrumb/breadcrumb.demo.tsx?raw"
import buttonDemoSource from "../../../../../packages/ui/src/styled/button/button.demo.tsx?raw"
import calloutDemoSource from "../../../../../packages/ui/src/styled/callout/callout.demo.tsx?raw"
import cardSectionDemoSource from "../../../../../packages/ui/src/styled/cardSection/cardSection.demo.tsx?raw"
import checkboxDemoSource from "../../../../../packages/ui/src/styled/checkbox/checkbox.demo.tsx?raw"
import chipDemoSource from "../../../../../packages/ui/src/styled/chip/chip.demo.tsx?raw"
import collapsibleDemoSource from "../../../../../packages/ui/src/styled/collapsible/collapsible.demo.tsx?raw"
import comboboxDemoSource from "../../../../../packages/ui/src/styled/combobox/combobox.demo.tsx?raw"
import commandPaletteDemoSource from "../../../../../packages/ui/src/styled/commandPalette/commandPalette.demo.tsx?raw"
import contextMenuDemoSource from "../../../../../packages/ui/src/styled/contextMenu/contextMenu.demo.tsx?raw"
import copyButtonDemoSource from "../../../../../packages/ui/src/styled/copyButton/copyButton.demo.tsx?raw"
import dialogDemoSource from "../../../../../packages/ui/src/styled/dialog/dialog.demo.tsx?raw"
import dividerDemoSource from "../../../../../packages/ui/src/styled/divider/divider.demo.tsx?raw"
import drawerDemoSource from "../../../../../packages/ui/src/styled/drawer/drawer.demo.tsx?raw"
import dropdownMenuDemoSource from "../../../../../packages/ui/src/styled/dropdownMenu/dropdownMenu.demo.tsx?raw"
import emptyStateDemoSource from "../../../../../packages/ui/src/styled/emptyState/emptyState.demo.tsx?raw"
import fieldDemoSource from "../../../../../packages/ui/src/styled/field/field.demo.tsx?raw"
import hoverCardDemoSource from "../../../../../packages/ui/src/styled/hoverCard/hoverCard.demo.tsx?raw"
import inlineErrorDemoSource from "../../../../../packages/ui/src/styled/inlineError/inlineError.demo.tsx?raw"
import inputDemoSource from "../../../../../packages/ui/src/styled/input/input.demo.tsx?raw"
import kbdDemoSource from "../../../../../packages/ui/src/styled/kbd/kbd.demo.tsx?raw"
import linkDemoSource from "../../../../../packages/ui/src/styled/link/link.demo.tsx?raw"
import listRowDemoSource from "../../../../../packages/ui/src/styled/listRow/listRow.demo.tsx?raw"
import menubarDemoSource from "../../../../../packages/ui/src/styled/menubar/menubar.demo.tsx?raw"
import paginationDemoSource from "../../../../../packages/ui/src/styled/pagination/pagination.demo.tsx?raw"
import popoverDemoSource from "../../../../../packages/ui/src/styled/popover/popover.demo.tsx?raw"
import progressDemoSource from "../../../../../packages/ui/src/styled/progress/progress.demo.tsx?raw"
import radioGroupDemoSource from "../../../../../packages/ui/src/styled/radioGroup/radioGroup.demo.tsx?raw"
import scrollAreaDemoSource from "../../../../../packages/ui/src/styled/scrollArea/scrollArea.demo.tsx?raw"
import segmentedControlDemoSource from "../../../../../packages/ui/src/styled/segmentedControl/segmentedControl.demo.tsx?raw"
import selectDemoSource from "../../../../../packages/ui/src/styled/select/select.demo.tsx?raw"
import skeletonDemoSource from "../../../../../packages/ui/src/styled/skeleton/skeleton.demo.tsx?raw"
import sliderDemoSource from "../../../../../packages/ui/src/styled/slider/slider.demo.tsx?raw"
import spinnerDemoSource from "../../../../../packages/ui/src/styled/spinner/spinner.demo.tsx?raw"
import stepsDemoSource from "../../../../../packages/ui/src/styled/steps/steps.demo.tsx?raw"
import switchDemoSource from "../../../../../packages/ui/src/styled/switch/switch.demo.tsx?raw"
import tableDemoSource from "../../../../../packages/ui/src/styled/table/table.demo.tsx?raw"
import tabsDemoSource from "../../../../../packages/ui/src/styled/tabs/tabs.demo.tsx?raw"
import tagInputDemoSource from "../../../../../packages/ui/src/styled/tagInput/tagInput.demo.tsx?raw"
import textareaDemoSource from "../../../../../packages/ui/src/styled/textarea/textarea.demo.tsx?raw"
import timelineDemoSource from "../../../../../packages/ui/src/styled/timeline/timeline.demo.tsx?raw"
import toastDemoSource from "../../../../../packages/ui/src/styled/toast/toast.demo.tsx?raw"
import toggleGroupDemoSource from "../../../../../packages/ui/src/styled/toggleGroup/toggleGroup.demo.tsx?raw"
import tooltipDemoSource from "../../../../../packages/ui/src/styled/tooltip/tooltip.demo.tsx?raw"
import treeViewDemoSource from "../../../../../packages/ui/src/styled/treeView/treeView.demo.tsx?raw"
import truncateDemoSource from "../../../../../packages/ui/src/styled/truncate/truncate.demo.tsx?raw"
import visuallyHiddenDemoSource from "../../../../../packages/ui/src/styled/visuallyHidden/visuallyHidden.demo.tsx?raw"

const AccordionDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/accordion/accordion.demo").then((module) => ({
    default: module.AccordionDemo,
  })),
)

const AvatarDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/avatar/avatar.demo").then((module) => ({
    default: module.AvatarDemo,
  })),
)

const BadgeDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/badge/badge.demo").then((module) => ({
    default: module.BadgeDemo,
  })),
)

const BreadcrumbDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/breadcrumb/breadcrumb.demo").then((module) => ({
    default: module.BreadcrumbDemo,
  })),
)

const ButtonDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/button/button.demo").then((module) => ({
    default: module.ButtonDemo,
  })),
)

const IconButtonDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/button/button.demo").then((module) => ({
    default: module.IconButtonDemo,
  })),
)

const BannerDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/callout/callout.demo").then((module) => ({
    default: module.BannerDemo,
  })),
)

const AlertDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/callout/callout.demo").then((module) => ({
    default: module.AlertDemo,
  })),
)

const CardSectionDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/cardSection/cardSection.demo").then((module) => ({
    default: module.CardSectionDemo,
  })),
)

const CheckboxDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/checkbox/checkbox.demo").then((module) => ({
    default: module.CheckboxDemo,
  })),
)

const ChipDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/chip/chip.demo").then((module) => ({
    default: module.ChipDemo,
  })),
)

const CollapsibleDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/collapsible/collapsible.demo").then((module) => ({
    default: module.CollapsibleDemo,
  })),
)

const ComboboxDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/combobox/combobox.demo").then((module) => ({
    default: module.ComboboxDemo,
  })),
)

const CommandPaletteDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/commandPalette/commandPalette.demo").then(
    (module) => ({
      default: module.CommandPaletteDemo,
    }),
  ),
)

const ContextMenuDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/contextMenu/contextMenu.demo").then((module) => ({
    default: module.ContextMenuDemo,
  })),
)

const CopyButtonDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/copyButton/copyButton.demo").then((module) => ({
    default: module.CopyButtonDemo,
  })),
)

const DialogDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/dialog/dialog.demo").then((module) => ({
    default: module.DialogDemo,
  })),
)

const DividerDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/divider/divider.demo").then((module) => ({
    default: module.DividerDemo,
  })),
)

const DrawerDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/drawer/drawer.demo").then((module) => ({
    default: module.DrawerDemo,
  })),
)

const DropdownMenuDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/dropdownMenu/dropdownMenu.demo").then((module) => ({
    default: module.DropdownMenuDemo,
  })),
)

const EmptyStateDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/emptyState/emptyState.demo").then((module) => ({
    default: module.EmptyStateDemo,
  })),
)

const FieldDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/field/field.demo").then((module) => ({
    default: module.FieldDemo,
  })),
)

const HoverCardDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/hoverCard/hoverCard.demo").then((module) => ({
    default: module.HoverCardDemo,
  })),
)

const InlineErrorDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/inlineError/inlineError.demo").then((module) => ({
    default: module.InlineErrorDemo,
  })),
)

const InputDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/input/input.demo").then((module) => ({
    default: module.InputDemo,
  })),
)

const KbdDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/kbd/kbd.demo").then((module) => ({
    default: module.KbdDemo,
  })),
)

const LinkDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/link/link.demo").then((module) => ({
    default: module.LinkDemo,
  })),
)

const ListRowDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/listRow/listRow.demo").then((module) => ({
    default: module.ListRowDemo,
  })),
)

const MenubarDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/menubar/menubar.demo").then((module) => ({
    default: module.MenubarDemo,
  })),
)

const PaginationDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/pagination/pagination.demo").then((module) => ({
    default: module.PaginationDemo,
  })),
)

const PopoverDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/popover/popover.demo").then((module) => ({
    default: module.PopoverDemo,
  })),
)

const ProgressDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/progress/progress.demo").then((module) => ({
    default: module.ProgressDemo,
  })),
)

const RadioGroupDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/radioGroup/radioGroup.demo").then((module) => ({
    default: module.RadioGroupDemo,
  })),
)

const ScrollAreaDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/scrollArea/scrollArea.demo").then((module) => ({
    default: module.ScrollAreaDemo,
  })),
)

const SegmentedControlDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/segmentedControl/segmentedControl.demo").then(
    (module) => ({
      default: module.SegmentedControlDemo,
    }),
  ),
)

const SelectDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/select/select.demo").then((module) => ({
    default: module.SelectDemo,
  })),
)

const SkeletonDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/skeleton/skeleton.demo").then((module) => ({
    default: module.SkeletonDemo,
  })),
)

const SliderDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/slider/slider.demo").then((module) => ({
    default: module.SliderDemo,
  })),
)

const SpinnerDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/spinner/spinner.demo").then((module) => ({
    default: module.SpinnerDemo,
  })),
)

const StepsDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/steps/steps.demo").then((module) => ({
    default: module.StepsDemo,
  })),
)

const SwitchDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/switch/switch.demo").then((module) => ({
    default: module.SwitchDemo,
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

const TagInputDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/tagInput/tagInput.demo").then((module) => ({
    default: module.TagInputDemo,
  })),
)

const TextareaDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/textarea/textarea.demo").then((module) => ({
    default: module.TextareaDemo,
  })),
)

const TimelineDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/timeline/timeline.demo").then((module) => ({
    default: module.TimelineDemo,
  })),
)

const ToastDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/toast/toast.demo").then((module) => ({
    default: module.ToastDemo,
  })),
)

const ToggleGroupDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/toggleGroup/toggleGroup.demo").then((module) => ({
    default: module.ToggleGroupDemo,
  })),
)

const TooltipDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/tooltip/tooltip.demo").then((module) => ({
    default: module.TooltipDemo,
  })),
)

const TreeViewDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/treeView/treeView.demo").then((module) => ({
    default: module.TreeViewDemo,
  })),
)

const TruncateDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/truncate/truncate.demo").then((module) => ({
    default: module.TruncateDemo,
  })),
)

const VisuallyHiddenDemo = lazy(() =>
  import("../../../../../packages/ui/src/styled/visuallyHidden/visuallyHidden.demo").then(
    (module) => ({
      default: module.VisuallyHiddenDemo,
    }),
  ),
)

export type DocsExampleId =
  | "accordion"
  | "alert"
  | "avatar"
  | "badge"
  | "banner"
  | "breadcrumb"
  | "button"
  | "card"
  | "checkbox"
  | "chip"
  | "collapsible"
  | "combobox"
  | "command"
  | "contextmenu"
  | "copybutton"
  | "dialog"
  | "divider"
  | "drawer"
  | "dropdown"
  | "empty"
  | "field"
  | "hovercard"
  | "iconbutton"
  | "inlineerror"
  | "input"
  | "kbd"
  | "link"
  | "listrow"
  | "menubar"
  | "pagination"
  | "popover"
  | "progress"
  | "radio"
  | "scrollarea"
  | "segmented"
  | "select"
  | "skeleton"
  | "slider"
  | "spinner"
  | "steps"
  | "switch"
  | "table"
  | "tabs"
  | "taginput"
  | "textarea"
  | "timeline"
  | "toast"
  | "togglegroup"
  | "tooltip"
  | "treeview"
  | "truncate"
  | "visuallyhidden"

export type DocsExample = {
  language: "tsx"
  source: string
  render: () => JSX.Element
}

const styles = stylex.create({
  render: {
    alignItems: "start",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    border: "1px dashed rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-card)",
    display: "grid",
    gap: 12,
    minWidth: 0,
    padding: 14,
    "@media (max-width: 560px)": {
      padding: 10,
    },
  },
})

const componentExample = (source: string, render: () => JSX.Element): DocsExample => ({
  language: "tsx",
  source,
  render: () => (
    <div {...sx(styles.render)} data-docs-demo>
      {render()}
    </div>
  ),
})

const renderLazy = (DemoComponent: Component): (() => JSX.Element) => {
  return () => (
    <Suspense fallback={null}>
      <DemoComponent />
    </Suspense>
  )
}

const registerExample = (source: string, DemoComponent: Component): DocsExample => {
  return componentExample(source, renderLazy(DemoComponent))
}

const docsExamples: Record<DocsExampleId, DocsExample> = {
  accordion: registerExample(accordionDemoSource, AccordionDemo),
  alert: registerExample(calloutDemoSource, AlertDemo),
  avatar: registerExample(avatarDemoSource, AvatarDemo),
  badge: registerExample(badgeDemoSource, BadgeDemo),
  banner: registerExample(calloutDemoSource, BannerDemo),
  breadcrumb: registerExample(breadcrumbDemoSource, BreadcrumbDemo),
  button: registerExample(buttonDemoSource, ButtonDemo),
  card: registerExample(cardSectionDemoSource, CardSectionDemo),
  checkbox: registerExample(checkboxDemoSource, CheckboxDemo),
  chip: registerExample(chipDemoSource, ChipDemo),
  collapsible: registerExample(collapsibleDemoSource, CollapsibleDemo),
  combobox: registerExample(comboboxDemoSource, ComboboxDemo),
  command: registerExample(commandPaletteDemoSource, CommandPaletteDemo),
  contextmenu: registerExample(contextMenuDemoSource, ContextMenuDemo),
  copybutton: registerExample(copyButtonDemoSource, CopyButtonDemo),
  dialog: registerExample(dialogDemoSource, DialogDemo),
  divider: registerExample(dividerDemoSource, DividerDemo),
  drawer: registerExample(drawerDemoSource, DrawerDemo),
  dropdown: registerExample(dropdownMenuDemoSource, DropdownMenuDemo),
  empty: registerExample(emptyStateDemoSource, EmptyStateDemo),
  field: registerExample(fieldDemoSource, FieldDemo),
  hovercard: registerExample(hoverCardDemoSource, HoverCardDemo),
  iconbutton: registerExample(buttonDemoSource, IconButtonDemo),
  inlineerror: registerExample(inlineErrorDemoSource, InlineErrorDemo),
  input: registerExample(inputDemoSource, InputDemo),
  kbd: registerExample(kbdDemoSource, KbdDemo),
  link: registerExample(linkDemoSource, LinkDemo),
  listrow: registerExample(listRowDemoSource, ListRowDemo),
  menubar: registerExample(menubarDemoSource, MenubarDemo),
  pagination: registerExample(paginationDemoSource, PaginationDemo),
  popover: registerExample(popoverDemoSource, PopoverDemo),
  progress: registerExample(progressDemoSource, ProgressDemo),
  radio: registerExample(radioGroupDemoSource, RadioGroupDemo),
  scrollarea: registerExample(scrollAreaDemoSource, ScrollAreaDemo),
  segmented: registerExample(segmentedControlDemoSource, SegmentedControlDemo),
  select: registerExample(selectDemoSource, SelectDemo),
  skeleton: registerExample(skeletonDemoSource, SkeletonDemo),
  slider: registerExample(sliderDemoSource, SliderDemo),
  spinner: registerExample(spinnerDemoSource, SpinnerDemo),
  steps: registerExample(stepsDemoSource, StepsDemo),
  switch: registerExample(switchDemoSource, SwitchDemo),
  table: registerExample(tableDemoSource, TableDemo),
  tabs: registerExample(tabsDemoSource, TabsDemo),
  taginput: registerExample(tagInputDemoSource, TagInputDemo),
  textarea: registerExample(textareaDemoSource, TextareaDemo),
  timeline: registerExample(timelineDemoSource, TimelineDemo),
  toast: registerExample(toastDemoSource, ToastDemo),
  togglegroup: registerExample(toggleGroupDemoSource, ToggleGroupDemo),
  tooltip: registerExample(tooltipDemoSource, TooltipDemo),
  treeview: registerExample(treeViewDemoSource, TreeViewDemo),
  truncate: registerExample(truncateDemoSource, TruncateDemo),
  visuallyhidden: registerExample(visuallyHiddenDemoSource, VisuallyHiddenDemo),
}

export function getDocsExample(id: DocsExampleId) {
  return docsExamples[id]
}
