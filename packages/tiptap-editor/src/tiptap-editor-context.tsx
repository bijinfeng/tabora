import { createContext, useContext, type Accessor, type JSX } from "solid-js"
import type { Editor } from "@tiptap/core"
import type { HeadlessTiptapEditorProps } from "./tiptap-editor"

export type TiptapEditorVisibility = "private" | "public" | "friends"

export type TiptapEditorPrimitiveContext = {
  editor: Accessor<Editor | null>
  registerEditor: (editor: Editor) => void
  reportEditorUpdate: (event: { editor: Editor }) => void
  editable: Accessor<boolean>
  disabled: Accessor<boolean>
  empty: Accessor<boolean>
  initialized: Accessor<boolean>
  focused: Accessor<boolean>
  value: Accessor<string>
  visibility: Accessor<TiptapEditorVisibility>
  setVisibility: (v: TiptapEditorVisibility) => void
  formatToolbarVisible: Accessor<boolean>
  setFormatToolbarVisible: (v: boolean) => void
  focusMode: Accessor<boolean>
  setFocusMode: (v: boolean) => void
  extensions: Accessor<HeadlessTiptapEditorProps["extensions"]>
  size: Accessor<"sm" | "md">
  invalid: Accessor<boolean>
}

const TiptapEditorContext = createContext<TiptapEditorPrimitiveContext | null>(null)

export function TiptapEditorProvider(
  props: TiptapEditorPrimitiveContext & { children: JSX.Element },
) {
  return (
    <TiptapEditorContext.Provider
      value={{
        get editor() {
          return props.editor
        },
        registerEditor(editor) {
          props.registerEditor(editor)
        },
        reportEditorUpdate(event) {
          props.reportEditorUpdate(event)
        },
        get editable() {
          return props.editable
        },
        get disabled() {
          return props.disabled
        },
        get empty() {
          return props.empty
        },
        get initialized() {
          return props.initialized
        },
        get focused() {
          return props.focused
        },
        get value() {
          return props.value
        },
        get visibility() {
          return props.visibility
        },
        setVisibility(v) {
          props.setVisibility(v)
        },
        get formatToolbarVisible() {
          return props.formatToolbarVisible
        },
        setFormatToolbarVisible(v) {
          props.setFormatToolbarVisible(v)
        },
        get focusMode() {
          return props.focusMode
        },
        setFocusMode(v) {
          props.setFocusMode(v)
        },
        get extensions() {
          return props.extensions
        },
        get size() {
          return props.size
        },
        get invalid() {
          return props.invalid
        },
      }}
    >
      {props.children}
    </TiptapEditorContext.Provider>
  )
}

export function useTiptapEditorContext(): TiptapEditorPrimitiveContext {
  const ctx = useContext(TiptapEditorContext)
  if (!ctx) {
    throw new Error(
      "[@tabora/tiptap-editor] Primitive components must be used inside <TiptapEditorRoot>.",
    )
  }
  return ctx
}

export type { Editor as TiptapEditorInstance } from "@tiptap/core"
