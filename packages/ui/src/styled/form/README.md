# Form 组件

基于 TanStack Form 的表单组件，API 风格参考 Ant Design Form。

## 特性

- 基于 TanStack Form，字段名和取值强类型
- 复用 `Field` 组件渲染 label / help / error，视觉与其他表单页一致
- 支持 `vertical`（默认）与 `inline` 两种布局
- 字段级校验，错误随字段 meta 实时显示

## 引入

Form 已包含在 `@tabora/ui` 中，依赖 `@tanstack/solid-form`。

```tsx
import { Form } from "@tabora/ui/form"
```

## 基本用法

`Form` 的 children 是渲染函数，参数为表单实例。`Form.Item` 的 children 也是渲染函数，参数是字段 accessor。

```tsx
import { Button } from "@tabora/ui/button"
import { Form } from "@tabora/ui/form"
import { Input } from "@tabora/ui/input"

type LoginForm = {
  email: string
  password: string
}

function LoginPage() {
  const handleSubmit = (values: LoginForm) => {
    console.warn("提交:", values)
  }

  return (
    <Form<LoginForm> defaultValues={{ email: "", password: "" }} onSubmit={handleSubmit}>
      {(form) => {
        const canSubmit = form.useSelector((state) => state.canSubmit)

        return (
          <>
            <Form.Item
              name="email"
              label="邮箱"
              htmlFor="login-email"
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
                  id="login-email"
                  type="email"
                  value={field().state.value}
                  onInput={(value) => field().handleChange(value)}
                  onBlur={field().handleBlur}
                  invalid={field().state.meta.errors.length > 0}
                />
              )}
            </Form.Item>

            <Form.Item>
              {() => (
                <Button type="submit" disabled={!canSubmit()}>
                  登录
                </Button>
              )}
            </Form.Item>
          </>
        )
      }}
    </Form>
  )
}
```

要点：

- `htmlFor` 需要和控件 `id` 一致，`Form.Item` 不会自动推导控件 id。
- 不传 `name` 的 `Form.Item` 是布局插槽，只复用行间距，不绑定字段。提交按钮用这种写法。
- 读取 `form.state` 请用 `form.useSelector(...)`，直接读 `form.state.x` 不会随状态变化重新渲染。

### 内联布局

```tsx
<Form<SearchForm> defaultValues={{ keyword: "" }} onSubmit={handleSearch} layout="inline">
  {() => (
    <>
      <Form.Item name="keyword" label="关键词" htmlFor="search-keyword">
        {(field) => (
          <Input
            id="search-keyword"
            value={field().state.value}
            onInput={(value) => field().handleChange(value)}
            placeholder="搜索…"
          />
        )}
      </Form.Item>
      <Form.Item>{() => <Button type="submit">搜索</Button>}</Form.Item>
    </>
  )}
</Form>
```

## API

### Form Props

| 属性          | 类型                                                                           | 默认值       | 说明                 |
| ------------- | ------------------------------------------------------------------------------ | ------------ | -------------------- |
| defaultValues | `Partial<TFormData>`                                                           | -            | 表单默认值           |
| onSubmit      | `(values: TFormData, form: SimpleFormApi<TFormData>) => void \| Promise<void>` | -            | 校验通过后的提交回调 |
| layout        | `'vertical' \| 'inline'`                                                       | `'vertical'` | 表单布局             |
| class         | `string`                                                                       | -            | 自定义类名           |
| xstyle        | `StyleXStyles`                                                                 | -            | StyleX 样式          |
| children      | `JSX.Element \| ((form: SimpleFormApi<TFormData>) => JSX.Element)`             | -            | 子元素或渲染函数     |

### Form.Item Props

绑定字段时 `name` 必填；省略 `name` 即布局插槽，此时 `required` 和 `validators` 不适用。

| 属性       | 类型                                                                 | 默认值  | 说明                                  |
| ---------- | -------------------------------------------------------------------- | ------- | ------------------------------------- |
| name       | `DeepKeys<TFormData>`                                                | -       | 字段名；省略则作为布局插槽            |
| label      | `JSX.Element`                                                        | -       | 标签内容；不传则不渲染 label 与错误行 |
| htmlFor    | `string`                                                             | -       | 关联 label 的控件 id                  |
| required   | `boolean`                                                            | `false` | 是否显示必填星号（仅视觉，不含校验）  |
| help       | `JSX.Element`                                                        | -       | 提示文本                              |
| validators | `{ onMount?, onChange?, onBlur?, onSubmit? }`                        | -       | 字段校验器                            |
| class      | `string`                                                             | -       | 自定义类名                            |
| xstyle     | `StyleXStyles`                                                       | -       | StyleX 样式                           |
| children   | `(field: () => SimpleFieldApi) => JSX.Element` / `() => JSX.Element` | -       | 渲染函数                              |

### useFormContext

在 Form 的子组件里访问表单实例：

```tsx
import { useFormContext } from "@tabora/ui/form"

function ResetButton() {
  const form = useFormContext<MyFormData>()
  return (
    <button type="button" onClick={() => form.reset()}>
      重置
    </button>
  )
}
```

## 校验

`validators` 按时机划分，返回 `undefined` 表示通过，返回字符串表示错误文案：

```tsx
<Form.Item
  name="email"
  label="邮箱"
  validators={{
    onChange: ({ value }) => (value.includes("@") ? undefined : "无效邮箱"),
    onBlur: ({ value }) => (value ? undefined : "邮箱不能为空"),
  }}
>
  {(field) => <Input value={field().state.value} onInput={field().handleChange} />}
</Form.Item>
```

`onSubmit` 时机的校验在提交时统一执行；校验不通过则不会调用 `Form` 的 `onSubmit`。
通过 `fieldApi.form.state.values` 可以做跨字段校验（例如确认密码）：

```tsx
<Form.Item
  name="confirm"
  label="确认密码"
  validators={{
    onChange: ({ value, fieldApi }) =>
      value === fieldApi.form.state.values.password ? undefined : "两次输入的密码不一致",
  }}
>
  {(field) => <Input type="password" value={field().state.value} onInput={field().handleChange} />}
</Form.Item>
```

## 与 Ant Design 的差异

1. **渲染方式**：用 render props 而非克隆子元素注入 props。

   ```tsx
   // Ant Design
   <Form.Item name="email">
     <Input />
   </Form.Item>

   // @tabora/ui
   <Form.Item name="email">
     {(field) => <Input value={field().state.value} onInput={field().handleChange} />}
   </Form.Item>
   ```

2. **布局**：只提供 `vertical` 和 `inline`，不做栅格。
3. **功能范围**：不包含 `Form.List`、`Form.useForm` 等高级能力。

## 相关组件

- `Field` — 独立的表单字段布局组件，Form.Item 内部即复用它
- `Input` — 输入框组件
- `Button` — 按钮组件

## 参考

- [TanStack Form 文档](https://tanstack.com/form/latest)
- [Ant Design Form](https://ant.design/components/form-cn)
