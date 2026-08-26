import FileHandler from "@tiptap/extension-file-handler"
import type { Editor } from "@tiptap/core"

import { insertFile } from "./file-content"
import { insertMedia } from "./media-content"

type UploadImage = ((file: File) => Promise<string>) | undefined

export async function insertIncomingFiles(
  editor: Editor,
  files: File[],
  uploadImage?: UploadImage,
  position?: number,
) {
  if (position !== undefined && !editor.commands.setTextSelection(position)) return
  for (const file of files) {
    if (file.type.startsWith("image/")) await insertMedia(editor, file, uploadImage)
    else await insertFile(editor, file)
  }
}

export function createFileHandlerExtension(uploadImage?: UploadImage) {
  return FileHandler.configure({
    consumePasteEvent: true,
    onDrop: (editor, files, position) => {
      void insertIncomingFiles(editor, files, uploadImage, position)
    },
    onPaste: (editor, files) => {
      void insertIncomingFiles(editor, files, uploadImage)
    },
  })
}
