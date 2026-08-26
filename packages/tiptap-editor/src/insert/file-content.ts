import type { Editor } from "@tiptap/core"

import { maxEmbeddedFileSize, readFileAsDataUrl } from "./file-data"

export async function insertFile(editor: Editor, file: File) {
  if (file.size > maxEmbeddedFileSize) throw new Error("文件超过 5 MB")
  const href = await readFileAsDataUrl(file)
  editor.commands.insertContent({
    type: "attachment",
    attrs: { href, name: file.name, mediaType: file.type },
  })
  editor.commands.setTextSelection(editor.state.doc.content.size)
}
