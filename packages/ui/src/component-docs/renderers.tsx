import { ErrorBoundary, Suspense, lazy } from "solid-js"

import { getComponentDoc } from "./metadata"
import type { ComponentDocDemoProps, ComponentDocDemoRenderer } from "./types"

export type { ComponentDocDemoProps, ComponentDocDemoRenderer } from "./types"

export type ComponentDocDemoLoader = () => Promise<{ default: ComponentDocDemoRenderer }>

export const componentDocDemoLoaders: Record<string, ComponentDocDemoLoader> = {
  accordion: () =>
    import("../styled/accordion/accordion.demo").then((module) => ({
      default: module.AccordionDemo,
    })),
  alert: () =>
    import("../styled/callout/callout.demo").then((module) => ({ default: module.AlertDemo })),
  avatar: () =>
    import("../styled/avatar/avatar.demo").then((module) => ({ default: module.AvatarDemo })),
  badge: () =>
    import("../styled/badge/badge.demo").then((module) => ({ default: module.BadgeDemo })),
  banner: () =>
    import("../styled/callout/callout.demo").then((module) => ({ default: module.BannerDemo })),
  breadcrumb: () =>
    import("../styled/breadcrumb/breadcrumb.demo").then((module) => ({
      default: module.BreadcrumbDemo,
    })),
  button: () =>
    import("../styled/button/button.demo").then((module) => ({ default: module.ButtonDemo })),
  cardsection: () =>
    import("../styled/cardSection/cardSection.demo").then((module) => ({
      default: module.CardSectionDemo,
    })),
  checkbox: () =>
    import("../styled/checkbox/checkbox.demo").then((module) => ({
      default: module.CheckboxDemo,
    })),
  chip: () => import("../styled/chip/chip.demo").then((module) => ({ default: module.ChipDemo })),
  collapsible: () =>
    import("../styled/collapsible/collapsible.demo").then((module) => ({
      default: module.CollapsibleDemo,
    })),
  combobox: () =>
    import("../styled/combobox/combobox.demo").then((module) => ({
      default: module.ComboboxDemo,
    })),
  command: () =>
    import("../styled/commandPalette/commandPalette.demo").then((module) => ({
      default: module.CommandPaletteDemo,
    })),
  contextmenu: () =>
    import("../styled/contextMenu/contextMenu.demo").then((module) => ({
      default: module.ContextMenuDemo,
    })),
  copybutton: () =>
    import("../styled/copyButton/copyButton.demo").then((module) => ({
      default: module.CopyButtonDemo,
    })),
  dialog: () =>
    import("../styled/dialog/dialog.demo").then((module) => ({ default: module.DialogDemo })),
  divider: () =>
    import("../styled/divider/divider.demo").then((module) => ({ default: module.DividerDemo })),
  drawer: () =>
    import("../styled/drawer/drawer.demo").then((module) => ({ default: module.DrawerDemo })),
  dropdown: () =>
    import("../styled/dropdownMenu/dropdownMenu.demo").then((module) => ({
      default: module.DropdownMenuDemo,
    })),
  emptystate: () =>
    import("../styled/emptyState/emptyState.demo").then((module) => ({
      default: module.EmptyStateDemo,
    })),
  field: () =>
    import("../styled/field/field.demo").then((module) => ({ default: module.FieldDemo })),
  hovercard: () =>
    import("../styled/hoverCard/hoverCard.demo").then((module) => ({
      default: module.HoverCardDemo,
    })),
  iconbutton: () =>
    import("../styled/button/button.demo").then((module) => ({ default: module.IconButtonDemo })),
  stepper: () =>
    import("../styled/stepper/stepper.demo").then((module) => ({ default: module.StepperDemo })),
  inlineerror: () =>
    import("../styled/inlineError/inlineError.demo").then((module) => ({
      default: module.InlineErrorDemo,
    })),
  input: () =>
    import("../styled/input/input.demo").then((module) => ({ default: module.InputDemo })),
  kbd: () => import("../styled/kbd/kbd.demo").then((module) => ({ default: module.KbdDemo })),
  link: () => import("../styled/link/link.demo").then((module) => ({ default: module.LinkDemo })),
  listrow: () =>
    import("../styled/listRow/listRow.demo").then((module) => ({ default: module.ListRowDemo })),
  menubar: () =>
    import("../styled/menubar/menubar.demo").then((module) => ({ default: module.MenubarDemo })),
  pagination: () =>
    import("../styled/pagination/pagination.demo").then((module) => ({
      default: module.PaginationDemo,
    })),
  patterns: () => import("./patterns.demo").then((module) => ({ default: module.PatternsDemo })),
  popover: () =>
    import("../styled/popover/popover.demo").then((module) => ({ default: module.PopoverDemo })),
  progress: () =>
    import("../styled/progress/progress.demo").then((module) => ({ default: module.ProgressDemo })),
  radio: () =>
    import("../styled/radioGroup/radioGroup.demo").then((module) => ({
      default: module.RadioGroupDemo,
    })),
  scrollarea: () =>
    import("../styled/scrollArea/scrollArea.demo").then((module) => ({
      default: module.ScrollAreaDemo,
    })),
  segmented: () =>
    import("../styled/segmentedControl/segmentedControl.demo").then((module) => ({
      default: module.SegmentedControlDemo,
    })),
  select: () =>
    import("../styled/select/select.demo").then((module) => ({ default: module.SelectDemo })),
  skeleton: () =>
    import("../styled/skeleton/skeleton.demo").then((module) => ({ default: module.SkeletonDemo })),
  slider: () =>
    import("../styled/slider/slider.demo").then((module) => ({ default: module.SliderDemo })),
  spinner: () =>
    import("../styled/spinner/spinner.demo").then((module) => ({ default: module.SpinnerDemo })),
  steps: () =>
    import("../styled/steps/steps.demo").then((module) => ({ default: module.StepsDemo })),
  switch: () =>
    import("../styled/switch/switch.demo").then((module) => ({ default: module.SwitchDemo })),
  table: () =>
    import("../styled/table/table.demo").then((module) => ({ default: module.TableDemo })),
  tabs: () => import("../styled/tabs/tabs.demo").then((module) => ({ default: module.TabsDemo })),
  taginput: () =>
    import("../styled/tagInput/tagInput.demo").then((module) => ({ default: module.TagInputDemo })),
  textarea: () =>
    import("../styled/textarea/textarea.demo").then((module) => ({ default: module.TextareaDemo })),
  timeline: () =>
    import("../styled/timeline/timeline.demo").then((module) => ({ default: module.TimelineDemo })),
  toast: () =>
    import("../styled/toast/toast.demo").then((module) => ({ default: module.ToastDemo })),
  togglegroup: () =>
    import("../styled/toggleGroup/toggleGroup.demo").then((module) => ({
      default: module.ToggleGroupDemo,
    })),
  tooltip: () =>
    import("../styled/tooltip/tooltip.demo").then((module) => ({ default: module.TooltipDemo })),
  treeview: () =>
    import("../styled/treeView/treeView.demo").then((module) => ({ default: module.TreeViewDemo })),
  truncate: () =>
    import("../styled/truncate/truncate.demo").then((module) => ({ default: module.TruncateDemo })),
  visuallyhidden: () =>
    import("../styled/visuallyHidden/visuallyHidden.demo").then((module) => ({
      default: module.VisuallyHiddenDemo,
    })),
}

const componentDocDemoRenderers = Object.fromEntries(
  Object.entries(componentDocDemoLoaders).map(([id, load]) => [id, lazy(load)]),
) as Record<string, ComponentDocDemoRenderer>

export function ComponentDocDemo(props: ComponentDocDemoProps) {
  const Demo = componentDocDemoRenderers[props.id]

  if (!Demo || !getComponentDoc(props.id)) {
    return null
  }

  return (
    <ErrorBoundary fallback={<span role="status">示例加载失败</span>}>
      <Suspense fallback={<span role="status">正在加载示例…</span>}>
        <Demo id={props.id} />
      </Suspense>
    </ErrorBoundary>
  )
}
