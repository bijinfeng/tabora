import { createSignal, splitProps, type ComponentProps } from "solid-js"
import { useTiptapEditor } from "./use-tiptap-editor"
import type { UseTiptapEditorOptions } from "./use-tiptap-editor"
import type { Editor } from "@tiptap/core"

export type HeadlessTiptapEditorProps = ComponentProps<"div"> &
  UseTiptapEditorOptions & {
    onReady?: ((editor: Editor) => void) | undefined
    placeholder?: string | undefined
  }

export function HeadlessTiptapEditor(props: HeadlessTiptapEditorProps) {
  const [local, rest] = splitProps(props, [
    "onReady",
    "extensions",
    "content",
    "editable",
    "injectCSS",
    "autofocus",
    "editorProps",
    "parseOptions",
    "enableInputRules",
    "enablePasteRules",
    "enableContentCheck",
    "emitContentError",
    "textDirection",
    "enableCoreExtensions",
    "coreExtensionOptions",
    "onBeforeCreate",
    "onCreate",
    "onMount",
    "onUnmount",
    "onUpdate",
    "onSelectionUpdate",
    "onTransaction",
    "onFocus",
    "onBlur",
    "onDestroy",
    "onContentError",
    "immediate",
    "class",
    "ref",
  ])

  const [elementRef, setElementRef] = createSignal<HTMLElement | null>(null)

  const {
    editor: _editor,
    isInitialized,
    isFocused,
    isEmpty,
    html: _html,
    json: _json,
    text: _text,
  } = useTiptapEditor(elementRef, {
    extensions: local.extensions,
    content: local.content,
    editable: local.editable,
    injectCSS: local.injectCSS,
    autofocus: local.autofocus,
    editorProps: local.editorProps,
    parseOptions: local.parseOptions,
    enableInputRules: local.enableInputRules,
    enablePasteRules: local.enablePasteRules,
    enableContentCheck: local.enableContentCheck,
    emitContentError: local.emitContentError,
    textDirection: local.textDirection,
    enableCoreExtensions: local.enableCoreExtensions,
    coreExtensionOptions: local.coreExtensionOptions,
    onBeforeCreate: local.onBeforeCreate,
    onCreate: (e) => {
      local.onCreate?.(e)
      local.onReady?.(e.editor)
    },
    onMount: local.onMount,
    onUnmount: local.onUnmount,
    onUpdate: local.onUpdate,
    onSelectionUpdate: local.onSelectionUpdate,
    onTransaction: local.onTransaction,
    onFocus: local.onFocus,
    onBlur: local.onBlur,
    onDestroy: local.onDestroy,
    onContentError: local.onContentError,
    immediate: local.immediate,
  })

  type DivRefCallback = (el: HTMLDivElement) => void
  type DivRefObject = { el: HTMLDivElement | null }

  return (
    <div
      {...rest}
      ref={(el) => {
        setElementRef(el)
        const ref = local.ref
        if (typeof ref === "function") {
          ;(ref as DivRefCallback)(el)
        } else if (ref && typeof ref === "object" && "el" in ref) {
          ;(ref as DivRefObject).el = el
        }
      }}
      data-editor-initialized={isInitialized() ? "true" : "false"}
      data-editor-focused={isFocused() ? "true" : "false"}
      data-editor-empty={isEmpty() ? "true" : "false"}
      data-tiptap-wrapper
      class={local.class}
    />
  )
}

export type { Editor as TiptapEditor } from "@tiptap/core"
