import * as stylex from "@stylexjs/stylex"
import { createSignal, Show } from "solid-js"

import { Badge } from "../badge"
import { Button } from "../button"
import { demoStyles } from "../demoStyles"
import { Input } from "../input"
import { Form } from "./index"

type LoginFormData = {
  email: string
  password: string
}

type SearchFormData = {
  keyword: string
}

export function FormDemo() {
  const [submitted, setSubmitted] = createSignal<string>("")

  return (
    <div {...stylex.attrs(demoStyles.col)}>
      <div {...stylex.attrs(demoStyles.section)}>
        <div {...stylex.attrs(demoStyles.sectionTitle)}>垂直布局</div>
      </div>
      <Form<LoginFormData>
        defaultValues={{ email: "", password: "" }}
        onSubmit={(values) => {
          setSubmitted(`登录：${values.email}`)
        }}
      >
        {(form) => {
          const canSubmit = form.useSelector((state) => state.canSubmit)

          return (
            <>
              <Form.Item
                name="email"
                label="邮箱"
                htmlFor="form-demo-email"
                required
                help="请输入您的邮箱地址"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return "邮箱不能为空"
                    if (!value.includes("@")) return "请输入有效的邮箱地址"
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <Input
                    id="form-demo-email"
                    type="email"
                    value={field().state.value}
                    onInput={(value) => field().handleChange(value)}
                    onBlur={field().handleBlur}
                    invalid={field().state.meta.errors.length > 0}
                    placeholder="example@domain.com"
                  />
                )}
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                htmlFor="form-demo-password"
                required
                help="至少 8 位字符"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return "密码不能为空"
                    if (value.length < 8) return "密码至少需要 8 位字符"
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <Input
                    id="form-demo-password"
                    type="password"
                    value={field().state.value}
                    onInput={(value) => field().handleChange(value)}
                    onBlur={field().handleBlur}
                    invalid={field().state.meta.errors.length > 0}
                    placeholder="请输入密码"
                  />
                )}
              </Form.Item>

              <Form.Item>
                {() => (
                  <Button type="submit" fullWidth disabled={!canSubmit()}>
                    登录
                  </Button>
                )}
              </Form.Item>
            </>
          )
        }}
      </Form>

      <div {...stylex.attrs(demoStyles.section)}>
        <div {...stylex.attrs(demoStyles.sectionTitle)}>内联布局</div>
      </div>
      <Form<SearchFormData>
        defaultValues={{ keyword: "" }}
        onSubmit={(values) => {
          setSubmitted(`搜索：${values.keyword}`)
        }}
        layout="inline"
      >
        {() => (
          <>
            <Form.Item name="keyword" label="关键词" htmlFor="form-demo-keyword">
              {(field) => (
                <Input
                  id="form-demo-keyword"
                  value={field().state.value}
                  onInput={(value) => field().handleChange(value)}
                  placeholder="搜索…"
                  size="sm"
                />
              )}
            </Form.Item>
            <Form.Item>
              {() => (
                <Button type="submit" size="sm">
                  搜索
                </Button>
              )}
            </Form.Item>
          </>
        )}
      </Form>

      <Show when={submitted()}>
        {(message) => (
          <div {...stylex.attrs(demoStyles.row)}>
            <Badge variant="neutral">最近提交</Badge>
            <span>{message()}</span>
          </div>
        )}
      </Show>
    </div>
  )
}
