import { render } from "solid-js/web"
import { describe, expect, it, vi } from "vitest"

import { Form } from "./index"

type LoginFormData = {
  email: string
  password: string
}

function mount(ui: () => ReturnType<typeof Form>) {
  const root = document.createElement("div")
  document.body.appendChild(root)
  const dispose = render(ui, root)
  return {
    root,
    cleanup: () => {
      dispose()
      root.remove()
    },
  }
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe("Form", () => {
  it("exposes Form.Item on the component", () => {
    expect(typeof Form).toBe("function")
    expect(typeof Form.Item).toBe("function")
  })

  it("renders field rows and a nameless layout slot without touching field paths", () => {
    const { root, cleanup } = mount(() => (
      <Form<LoginFormData> defaultValues={{ email: "a@b.com", password: "" }} onSubmit={() => {}}>
        {() => (
          <>
            <Form.Item name="email" label="邮箱" htmlFor="test-email" required>
              {(field) => <input id="test-email" value={field().state.value} />}
            </Form.Item>
            <Form.Item>{() => <button type="submit">登录</button>}</Form.Item>
          </>
        )}
      </Form>
    ))

    const label = root.querySelector("label")!
    expect(label.htmlFor).toBe("test-email")
    expect(label.textContent).toContain("邮箱")
    expect(root.querySelector<HTMLInputElement>("#test-email")?.value).toBe("a@b.com")
    expect(root.querySelector("button")?.textContent).toBe("登录")

    cleanup()
  })

  it("submits values when every field passes validation", async () => {
    const onSubmit = vi.fn()
    const { root, cleanup } = mount(() => (
      <Form<LoginFormData>
        defaultValues={{ email: "admin@example.com", password: "secret" }}
        onSubmit={onSubmit}
      >
        {() => (
          <>
            <Form.Item
              name="email"
              label="邮箱"
              validators={{ onChange: ({ value }) => (value ? undefined : "邮箱不能为空") }}
            >
              {(field) => <input value={field().state.value} />}
            </Form.Item>
            <Form.Item>{() => <button type="submit">登录</button>}</Form.Item>
          </>
        )}
      </Form>
    ))

    root.querySelector("form")!.requestSubmit()
    await flush()

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      email: "admin@example.com",
      password: "secret",
    })

    cleanup()
  })

  it("blocks submit and shows the field error when validation fails", async () => {
    const onSubmit = vi.fn()
    const { root, cleanup } = mount(() => (
      <Form<LoginFormData> defaultValues={{ email: "", password: "" }} onSubmit={onSubmit}>
        {() => (
          <>
            <Form.Item
              name="email"
              label="邮箱"
              required
              validators={{ onChange: ({ value }) => (value ? undefined : "邮箱不能为空") }}
            >
              {(field) => <input value={field().state.value} />}
            </Form.Item>
            <Form.Item>{() => <button type="submit">登录</button>}</Form.Item>
          </>
        )}
      </Form>
    ))

    root.querySelector("form")!.requestSubmit()
    await flush()

    expect(onSubmit).not.toHaveBeenCalled()
    expect(root.querySelector("[role='alert']")?.textContent).toBe("邮箱不能为空")

    cleanup()
  })
})
