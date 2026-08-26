import { mergeAttributes, Node } from "@tiptap/core"

export const attachmentExtension = Node.create({
  name: "attachment",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      href: { default: "" },
      name: { default: "文件" },
      mediaType: { default: "" },
    }
  },
  parseHTML() {
    return [{ tag: "a[data-tiptap-attachment]" }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-tiptap-attachment": "",
        download: HTMLAttributes.name as string,
      }),
      HTMLAttributes.name as string,
    ]
  },
})
