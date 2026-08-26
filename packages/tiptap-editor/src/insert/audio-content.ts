import type { Editor } from "@tiptap/core"

import { maxEmbeddedFileSize, readFileAsDataUrl } from "./file-data"

export async function insertRecordedAudio(editor: Editor, chunks: Blob[], mimeType: string) {
  const audio = new File(chunks, "recording.webm", { type: mimeType || "audio/webm" })
  if (audio.size > maxEmbeddedFileSize) throw new Error("录音超过 5 MB，未插入编辑器。")
  const src = await readFileAsDataUrl(audio)
  editor.commands.insertContent({ type: "audio", attrs: { src, title: "录音" } })
  editor.commands.setTextSelection(editor.state.doc.content.size)
}
