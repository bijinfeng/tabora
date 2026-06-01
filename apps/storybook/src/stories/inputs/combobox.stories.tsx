import { Combobox } from "@tabora/ui"
import { createSignal } from "solid-js"
import type { Meta, StoryObj } from "storybook-solidjs"

const options = [
  { value: "1", label: "北京" },
  { value: "2", label: "上海" },
  { value: "3", label: "广州" },
  { value: "4", label: "深圳" },
  { value: "5", label: "杭州" },
  { value: "6", label: "成都" },
]

const meta = {
  title: "Inputs/Combobox",
  component: Combobox,
  args: {
    placeholder: "输入城市名称搜索",
    options,
  },
} satisfies Meta<typeof Combobox>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("")
    const handleSelect = (v: string) => {
      const opt = options.find((o) => o.value === v)
      if (opt) setValue(opt.label)
    }
    return (
      <Combobox
        {...args}
        value={value()}
        onInput={setValue}
        onSelect={handleSelect}
        options={options}
      />
    )
  },
}

export const WithPresetValue: Story = {
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("上海")
    return (
      <Combobox
        {...args}
        value={value()}
        onInput={setValue}
        onSelect={(v: string) => {
          const opt = options.find((o) => o.value === v)
          if (opt) setValue(opt.label)
        }}
        options={options}
      />
    )
  },
}

export const Empty: Story = {
  args: {
    placeholder: "搜索...",
    options: [],
  },
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("")
    return (
      <Combobox {...args} value={value()} onInput={setValue} onSelect={() => {}} options={[]} />
    )
  },
}
