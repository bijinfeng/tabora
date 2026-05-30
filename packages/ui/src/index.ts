export * from "./tokens"
// 向后兼容：保留旧路径
export { Button, IconButton } from "./primitives/button"
export type { ButtonProps, IconButtonProps, ButtonVariant, ButtonSize } from "./primitives/button"
// 新增：styled 版本
export { Button as StyledButton, IconButton as StyledIconButton } from "./styled/button"
export type {
  ButtonProps as StyledButtonProps,
  IconButtonProps as StyledIconButtonProps,
  ButtonVariant as StyledButtonVariant,
  ButtonSize as StyledButtonSize,
} from "./styled/button"
export { Input } from "./primitives/input/input"
export type { InputProps, InputSize, InputType } from "./primitives/input/input"
export { Input as StyledInput } from "./styled/input"
export type {
  InputProps as StyledInputProps,
  InputSize as StyledInputSize,
  InputType as StyledInputType,
} from "./styled/input"
export { Textarea } from "./primitives/textarea/textarea"
export type { TextareaProps } from "./primitives/textarea/textarea"
export { Textarea as StyledTextarea } from "./styled/textarea"
export type { TextareaProps as StyledTextareaProps } from "./styled/textarea"
export { Field } from "./primitives/field/field"
export type { FieldProps } from "./primitives/field/field"
export { Field as StyledField } from "./styled/field"
export type { FieldProps as StyledFieldProps } from "./styled/field"
export { Select } from "./primitives/select/select"
export type { SelectProps, SelectOption } from "./primitives/select/select"
export { Select as StyledSelect } from "./styled/select"
export type {
  SelectProps as StyledSelectProps,
  SelectOption as StyledSelectOption,
} from "./styled/select"
export { Checkbox } from "./primitives/checkbox/checkbox"
export type { CheckboxProps } from "./primitives/checkbox/checkbox"
export { Checkbox as StyledCheckbox } from "./styled/checkbox"
export type { CheckboxProps as StyledCheckboxProps } from "./styled/checkbox"
export { Switch } from "./primitives/switch/switch"
export type { SwitchProps } from "./primitives/switch/switch"
export { Switch as StyledSwitch } from "./styled/switch"
export type { SwitchProps as StyledSwitchProps } from "./styled/switch"
export { SegmentedControl } from "./primitives/segmentedControl/segmentedControl"
export type {
  SegmentedControlProps,
  SegmentedControlOption,
} from "./primitives/segmentedControl/segmentedControl"
export { SegmentedControl as StyledSegmentedControl } from "./styled/segmentedControl"
export type {
  SegmentedControlProps as StyledSegmentedControlProps,
  SegmentedControlOption as StyledSegmentedControlOption,
} from "./styled/segmentedControl"
export { Tabs } from "./primitives/tabs/tabs"
export type { TabsProps } from "./primitives/tabs/tabs"
export { Tabs as StyledTabs } from "./styled/tabs"
export type { TabsProps as StyledTabsProps } from "./styled/tabs"
export { Tooltip } from "./primitives/tooltip/tooltip"
export type { TooltipProps, TooltipPlacement } from "./primitives/tooltip/tooltip"
export { Tooltip as StyledTooltip } from "./styled/tooltip"
export type {
  TooltipProps as StyledTooltipProps,
  TooltipPlacement as StyledTooltipPlacement,
} from "./styled/tooltip"
export { Badge } from "./primitives/badge/badge"
export type { BadgeProps, BadgeVariant } from "./primitives/badge/badge"
export { Badge as StyledBadge } from "./styled/badge"
export type {
  BadgeProps as StyledBadgeProps,
  BadgeVariant as StyledBadgeVariant,
} from "./styled/badge"
export { InlineError } from "./primitives/inlineError/inlineError"
export type { InlineErrorProps } from "./primitives/inlineError/inlineError"
export { InlineError as StyledInlineError } from "./styled/inlineError"
export type { InlineErrorProps as StyledInlineErrorProps } from "./styled/inlineError"
export { Spinner } from "./primitives/spinner/spinner"
export type { SpinnerProps } from "./primitives/spinner/spinner"
export { Spinner as StyledSpinner } from "./styled/spinner"
export type { SpinnerProps as StyledSpinnerProps } from "./styled/spinner"
export { EmptyState } from "./primitives/emptyState/emptyState"
export type { EmptyStateProps } from "./primitives/emptyState/emptyState"
export { EmptyState as StyledEmptyState } from "./styled/emptyState"
export type { EmptyStateProps as StyledEmptyStateProps } from "./styled/emptyState"
export { ListRow } from "./primitives/listRow/listRow"
export type { ListRowProps } from "./primitives/listRow/listRow"
export { ListRow as StyledListRow } from "./styled/listRow"
export type { ListRowProps as StyledListRowProps } from "./styled/listRow"
export { CardSection } from "./primitives/cardSection/cardSection"
export type { CardSectionProps } from "./primitives/cardSection/cardSection"
export { CardSection as StyledCardSection } from "./styled/cardSection"
export type { CardSectionProps as StyledCardSectionProps } from "./styled/cardSection"

// V2 新增组件
export { VisuallyHidden } from "./primitives/visuallyHidden/visuallyHidden"
export { Divider } from "./styled/divider"
export type { DividerProps } from "./styled/divider"
export { Link } from "./styled/link"
export type { LinkProps } from "./styled/link"
export { Kbd } from "./styled/kbd"
export type { KbdProps } from "./styled/kbd"
export { Truncate } from "./styled/truncate"
export type { TruncateProps } from "./styled/truncate"
export { CopyButton } from "./styled/copyButton"
export type { CopyButtonProps } from "./styled/copyButton"
export { Skeleton, SkeletonText } from "./styled/skeleton"
export type { SkeletonProps } from "./styled/skeleton"
export { Avatar } from "./styled/avatar"
export type { AvatarProps } from "./styled/avatar"
export { Progress } from "./styled/progress"
export type { ProgressProps } from "./styled/progress"
export { Chip } from "./styled/chip"
export type { ChipProps } from "./styled/chip"
export { RadioGroup } from "./styled/radioGroup"
export type { RadioGroupProps, RadioGroupOption } from "./styled/radioGroup"
export { Combobox } from "./styled/combobox"
export type { ComboboxProps, ComboboxOption } from "./styled/combobox"
export { Dialog } from "./styled/dialog"
export type { DialogProps } from "./styled/dialog"
export { DropdownMenu } from "./styled/dropdownMenu"
export type { DropdownMenuProps, DropdownMenuItem } from "./styled/dropdownMenu"
export { Popover } from "./styled/popover"
export type { PopoverProps } from "./styled/popover"
export { Accordion } from "./styled/accordion"
export type { AccordionProps, AccordionItem } from "./styled/accordion"
export { Collapsible } from "./styled/collapsible"
export type { CollapsibleProps } from "./styled/collapsible"
export { Breadcrumb } from "./styled/breadcrumb"
export type { BreadcrumbProps, BreadcrumbItem } from "./styled/breadcrumb"
export { Slider } from "./styled/slider"
export type { SliderProps } from "./styled/slider"
export { Pagination } from "./styled/pagination"
export type { PaginationProps } from "./styled/pagination"
