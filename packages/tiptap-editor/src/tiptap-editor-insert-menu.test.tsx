import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"

import { defaultInsertMenuItems } from "./tiptap-editor-insert-menu"
import { TiptapEditor } from "./tiptap-editor.styled"

describe("defaultInsertMenuItems", () => {
  it("exposes an actionable flow for every default menu item", () => {
    expect(defaultInsertMenuItems).toMatchObject([
      { id: "media", onKind: "media" },
      { id: "audio", onKind: "audio" },
      { id: "file", onKind: "file" },
      { id: "link", onKind: "link" },
      { id: "location", onKind: "location" },
      { id: "sep-mode", kind: "separator" },
      { id: "focus-mode", onKind: "toggle-focus" },
      { id: "format-toolbar", onKind: "toggle-format-toolbar" },
    ])
  })

  it("renders the focus toolbar when the outer format toolbar is hidden", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <TiptapEditor
          variant="standard-with-menu"
          focusMode={true}
          defaultFormatToolbarVisible={false}
          content="<p>Draft</p>"
        />
      ),
      root,
    )

    expect(root.querySelector("[data-tiptap-focus-overlay]")).toBeTruthy()
    expect(root.querySelector("[data-tiptap-focus-card]")).toBeTruthy()
    expect(root.querySelector('[aria-label="退出聚焦模式"]')).toBeTruthy()
    root.remove()
  })
})
