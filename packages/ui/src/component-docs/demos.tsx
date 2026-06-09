import { AccordionDemo } from "../styled/accordion/accordion.demo"
import { AvatarDemo } from "../styled/avatar/avatar.demo"
import { BadgeDemo } from "../styled/badge/badge.demo"
import { BreadcrumbDemo } from "../styled/breadcrumb/breadcrumb.demo"
import { ButtonDemo, IconButtonDemo } from "../styled/button/button.demo"
import { AlertDemo, BannerDemo } from "../styled/callout/callout.demo"
import { CardSectionDemo } from "../styled/cardSection/cardSection.demo"
import { CheckboxDemo } from "../styled/checkbox/checkbox.demo"
import { ChipDemo } from "../styled/chip/chip.demo"
import { CollapsibleDemo } from "../styled/collapsible/collapsible.demo"
import { ComboboxDemo } from "../styled/combobox/combobox.demo"
import { CommandPaletteDemo } from "../styled/commandPalette/commandPalette.demo"
import { ContextMenuDemo } from "../styled/contextMenu/contextMenu.demo"
import { CopyButtonDemo } from "../styled/copyButton/copyButton.demo"
import { DialogDemo } from "../styled/dialog/dialog.demo"
import { DividerDemo } from "../styled/divider/divider.demo"
import { DrawerDemo } from "../styled/drawer/drawer.demo"
import { DropdownMenuDemo } from "../styled/dropdownMenu/dropdownMenu.demo"
import { EmptyStateDemo } from "../styled/emptyState/emptyState.demo"
import { FieldDemo } from "../styled/field/field.demo"
import { HoverCardDemo } from "../styled/hoverCard/hoverCard.demo"
import { InlineErrorDemo } from "../styled/inlineError/inlineError.demo"
import { InputDemo } from "../styled/input/input.demo"
import { KbdDemo } from "../styled/kbd/kbd.demo"
import { LinkDemo } from "../styled/link/link.demo"
import { ListRowDemo } from "../styled/listRow/listRow.demo"
import { MenubarDemo } from "../styled/menubar/menubar.demo"
import { PaginationDemo } from "../styled/pagination/pagination.demo"
import { PopoverDemo } from "../styled/popover/popover.demo"
import { ProgressDemo } from "../styled/progress/progress.demo"
import { RadioGroupDemo } from "../styled/radioGroup/radioGroup.demo"
import { ScrollAreaDemo } from "../styled/scrollArea/scrollArea.demo"
import { SegmentedControlDemo } from "../styled/segmentedControl/segmentedControl.demo"
import { SelectDemo } from "../styled/select/select.demo"
import { SkeletonDemo } from "../styled/skeleton/skeleton.demo"
import { SliderDemo } from "../styled/slider/slider.demo"
import { SpinnerDemo } from "../styled/spinner/spinner.demo"
import { StepsDemo } from "../styled/steps/steps.demo"
import { SwitchDemo } from "../styled/switch/switch.demo"
import { TableDemo } from "../styled/table/table.demo"
import { TabsDemo } from "../styled/tabs/tabs.demo"
import { TagInputDemo } from "../styled/tagInput/tagInput.demo"
import { TextareaDemo } from "../styled/textarea/textarea.demo"
import { TimelineDemo } from "../styled/timeline/timeline.demo"
import { ToastDemo } from "../styled/toast/toast.demo"
import { ToggleGroupDemo } from "../styled/toggleGroup/toggleGroup.demo"
import { TooltipDemo } from "../styled/tooltip/tooltip.demo"
import { TreeViewDemo } from "../styled/treeView/treeView.demo"
import { TruncateDemo } from "../styled/truncate/truncate.demo"
import { VisuallyHiddenDemo } from "../styled/visuallyHidden/visuallyHidden.demo"
import { getComponentDoc } from "./metadata"
import { PatternsDemo } from "./patterns.demo"
import type { ComponentDocDemoProps, ComponentDocDemoRenderer } from "./types"

export const componentDocDemoRenderers: Record<string, ComponentDocDemoRenderer> = {
  button: ButtonDemo,
  iconbutton: IconButtonDemo,
  input: InputDemo,
  textarea: TextareaDemo,
  select: SelectDemo,
  combobox: ComboboxDemo,
  link: LinkDemo,
  kbd: KbdDemo,
  taginput: TagInputDemo,
  breadcrumb: BreadcrumbDemo,
  checkbox: CheckboxDemo,
  switch: SwitchDemo,
  radio: RadioGroupDemo,
  segmented: SegmentedControlDemo,
  togglegroup: ToggleGroupDemo,
  tabs: TabsDemo,
  dropdown: DropdownMenuDemo,
  contextmenu: ContextMenuDemo,
  dialog: DialogDemo,
  drawer: DrawerDemo,
  popover: PopoverDemo,
  hovercard: HoverCardDemo,
  command: CommandPaletteDemo,
  tooltip: TooltipDemo,
  toast: ToastDemo,
  banner: BannerDemo,
  alert: AlertDemo,
  field: FieldDemo,
  badge: BadgeDemo,
  inlineerror: InlineErrorDemo,
  spinner: SpinnerDemo,
  skeleton: SkeletonDemo,
  progress: ProgressDemo,
  scrollarea: ScrollAreaDemo,
  divider: DividerDemo,
  chip: ChipDemo,
  avatar: AvatarDemo,
  accordion: AccordionDemo,
  collapsible: CollapsibleDemo,
  slider: SliderDemo,
  pagination: PaginationDemo,
  table: TableDemo,
  treeview: TreeViewDemo,
  menubar: MenubarDemo,
  steps: StepsDemo,
  timeline: TimelineDemo,
  emptystate: EmptyStateDemo,
  listrow: ListRowDemo,
  cardsection: CardSectionDemo,
  copybutton: CopyButtonDemo,
  truncate: TruncateDemo,
  visuallyhidden: VisuallyHiddenDemo,
  patterns: PatternsDemo,
}

export function ComponentDocDemo(props: ComponentDocDemoProps) {
  const Demo = componentDocDemoRenderers[props.id]

  if (!Demo || !getComponentDoc(props.id)) {
    return null
  }

  return <Demo id={props.id} />
}
