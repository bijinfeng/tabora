import type { Accessor } from "solid-js"
import { Show } from "solid-js"

import type { Editor } from "@tiptap/core"

import type { TiptapEditorInsertKind } from "../tiptap-editor-root"
import { AudioInsertDialog } from "./audio-dialog"
import { FileInsertDialog } from "./file-dialog"
import { LinkInsertDialog } from "./link-dialog"
import { LocationInsertDialog } from "./location-dialog"
import { MediaInsertDialog } from "./media-dialog"

export type TiptapEditorInsertDialogProps = {
  editor: Accessor<Editor | null>
  kind: TiptapEditorInsertKind | undefined
  onClose: () => void
  uploadImage?: ((file: File) => Promise<string>) | undefined
}

export function TiptapEditorInsertDialog(props: TiptapEditorInsertDialogProps) {
  return (
    <>
      <Show when={props.kind === "media"}>
        <MediaInsertDialog
          editor={props.editor}
          onClose={props.onClose}
          uploadImage={props.uploadImage}
        />
      </Show>
      <Show when={props.kind === "audio"}>
        <AudioInsertDialog editor={props.editor} onClose={props.onClose} />
      </Show>
      <Show when={props.kind === "file"}>
        <FileInsertDialog editor={props.editor} onClose={props.onClose} />
      </Show>
      <Show when={props.kind === "link"}>
        <LinkInsertDialog editor={props.editor} onClose={props.onClose} />
      </Show>
      <Show when={props.kind === "location"}>
        <LocationInsertDialog editor={props.editor} onClose={props.onClose} />
      </Show>
    </>
  )
}
