import { Breadcrumb } from "./breadcrumb.styled"

export function BreadcrumbDemo() {
  return (
    <Breadcrumb
      items={[{ label: "工作台", href: "/" }, { label: "设置" }, { label: "外观", current: true }]}
    />
  )
}
