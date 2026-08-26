import type { Editor } from "@tiptap/core"

import { readFileAsDataUrl } from "./file-data"

export async function insertMedia(
  editor: Editor,
  file: File,
  uploadImage?: (file: File) => Promise<string>,
) {
  const src = uploadImage ? await uploadImage(file) : await readFileAsDataUrl(file)
  editor.chain().focus().setImage({ src }).run()
  editor.commands.setTextSelection(editor.state.doc.content.size)
}
