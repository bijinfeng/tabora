import type { Editor } from "@tiptap/core"

export function insertLink(editor: Editor, label: string, href: string) {
  return editor.commands.insertContent({
    type: "paragraph",
    content: [{ type: "text", text: label, marks: [{ type: "link", attrs: { href } }] }],
  })
}
