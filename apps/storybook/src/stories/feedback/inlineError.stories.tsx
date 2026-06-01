import { InlineError } from "@tabora/ui"

export default {
  title: "Feedback/InlineError",
  component: InlineError,
  args: {
    children: "请输入有效的邮箱地址",
  },
}

export const Default = {
  render: () => <InlineError>请输入有效的邮箱地址</InlineError>,
}

export const LongMessage = {
  render: () => (
    <InlineError>密码长度至少为 8 位，且需要包含大写字母、小写字母和数字。</InlineError>
  ),
}
