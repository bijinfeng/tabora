import { Select } from "@tabora/ui"
import { createSignal } from "solid-js"
import type { Meta, StoryObj } from "storybook-solidjs-vite"
import type { SelectOption, SelectProps } from "@tabora/ui"

const options: SelectOption<string>[] = [
  { value: "google", label: "Google" },
  { value: "bing", label: "Bing" },
  { value: "duckduckgo", label: "DuckDuckGo（禁用）", disabled: true },
  { value: "perplexity", label: "Perplexity" },
  { value: "kagi", label: "Kagi Search" },
]

const defaultArgs: Pick<SelectProps<string>, "size" | "disabled" | "invalid" | "placeholder"> = {
  size: "md",
  disabled: false,
  invalid: false,
  placeholder: "请选择",
}

const meta = {
  title: "Inputs/Select",
  component: Select,
  argTypes: {
    size: { control: "select", options: ["sm", "md"] },
    disabled: { control: "boolean" },
    invalid: { control: "boolean" },
  },
  args: defaultArgs,
} satisfies Meta<typeof Select>

export default meta

type Story = StoryObj<typeof meta>
type SelectArgs = typeof meta.args

function toSelectProps(args: SelectArgs): Omit<SelectProps<string>, "value" | "onChange"> {
  return {
    options,
    ...(args.size !== undefined ? { size: args.size } : {}),
    ...(args.disabled !== undefined ? { disabled: args.disabled } : {}),
    ...(args.invalid !== undefined ? { invalid: args.invalid } : {}),
    ...(args.placeholder !== undefined ? { placeholder: args.placeholder } : {}),
  }
}

export const Default: Story = {
  render: (args: SelectArgs) => {
    const [value, setValue] = createSignal("")
    return <Select {...toSelectProps(args)} value={value()} onChange={setValue} />
  },
}

export const WithValue: Story = {
  render: (args: SelectArgs) => {
    const [value, setValue] = createSignal("bing")
    return <Select {...toSelectProps(args)} value={value()} onChange={setValue} />
  },
}

export const Invalid: Story = {
  args: { invalid: true },
  render: (args: SelectArgs) => {
    const [value, setValue] = createSignal("")
    return <Select {...toSelectProps(args)} value={value()} onChange={setValue} />
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  render: (args: SelectArgs) => {
    const [value, setValue] = createSignal("google")
    return <Select {...toSelectProps(args)} value={value()} onChange={setValue} />
  },
}

export const SmallSize: Story = {
  args: { size: "sm" },
  render: (args: SelectArgs) => {
    const [value, setValue] = createSignal("")
    return <Select {...toSelectProps(args)} value={value()} onChange={setValue} />
  },
}
