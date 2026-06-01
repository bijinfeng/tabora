import { Field } from "@tabora/ui"
import type { JSX } from "solid-js"

export default {
  title: "Layout/Field",
  component: Field,
  args: {
    label: "邮箱地址",
    required: false,
    htmlFor: "email-input",
  },
}

const inputStyle: JSX.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid var(--tbr-color-line)",
  "border-radius": "var(--tbr-radius-control)",
  width: "100%",
  "box-sizing": "border-box",
}

const DefaultInput = () => <input type="email" placeholder="请输入邮箱" style={inputStyle} />

export const Default = {
  render: () => (
    <Field label="邮箱地址" htmlFor="email-input">
      <DefaultInput />
    </Field>
  ),
}

export const Required = {
  render: () => (
    <Field label="邮箱地址" required htmlFor="email-input">
      <DefaultInput />
    </Field>
  ),
}

export const WithHelper = {
  render: () => (
    <Field
      label="邮箱地址"
      helper="请输入有效的邮箱地址，用于登录和接收通知。"
      htmlFor="email-input"
    >
      <DefaultInput />
    </Field>
  ),
}

export const WithError = {
  render: () => (
    <Field label="邮箱地址" error="邮箱格式不正确" required htmlFor="email-input">
      <DefaultInput />
    </Field>
  ),
}

export const WithHelperAndError = {
  render: () => (
    <Field
      label="密码"
      helper="密码长度至少为 8 位"
      error="密码长度不足，需包含大写字母和数字"
      required
      htmlFor="password-input"
    >
      <DefaultInput />
    </Field>
  ),
}
