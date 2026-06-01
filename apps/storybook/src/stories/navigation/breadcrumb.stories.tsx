import { Breadcrumb } from "@tabora/ui"

const items = [
  { label: "首页", href: "#" },
  { label: "设置", href: "#" },
  { label: "外观", href: "#" },
  { label: "主题选择", current: true },
]

export default {
  title: "Navigation/Breadcrumb",
  component: Breadcrumb,
  args: {
    items,
    separator: "/",
  },
}

export const Default = {
  render: () => <Breadcrumb items={items} separator="/" />,
}

export const CustomSeparator = {
  render: () => <Breadcrumb items={items} separator=">" />,
}

export const ShortPath = {
  render: () => (
    <Breadcrumb
      items={[
        { label: "首页", href: "#" },
        { label: "便签", current: true },
      ]}
      separator="/"
    />
  ),
}

export const AllLinks = {
  render: () => (
    <Breadcrumb
      items={[
        { label: "首页", href: "#" },
        { label: "文档", href: "#" },
        { label: "指南", href: "#" },
      ]}
      separator="/"
    />
  ),
}
