import { createEffect, createSignal, onCleanup, onMount } from "solid-js"
import type { Accessor } from "solid-js"
import { Editor } from "@tiptap/core"
import type { EditorOptions } from "@tiptap/core"

export type UseTiptapEditorOptions = {
  [K in keyof Omit<EditorOptions, "element">]?: Omit<EditorOptions, "element">[K] | undefined
} & {
  immediate?: boolean | undefined
}

export type TiptapEditorState = {
  editor: Accessor<Editor | null>
  isInitialized: Accessor<boolean>
  isFocused: Accessor<boolean>
  isEmpty: Accessor<boolean>
  html: Accessor<string>
  json: Accessor<unknown>
  text: Accessor<string>
}

export function useTiptapEditor(
  element: Accessor<HTMLElement | null>,
  options: UseTiptapEditorOptions = {},
): TiptapEditorState {
  const { immediate = true, ...editorOptions } = options
  const [editor, setEditor] = createSignal<Editor | null>(null)
  const [isInitialized, setIsInitialized] = createSignal(false)
  const [isFocused, setIsFocused] = createSignal(false)
  const [isEmpty, setIsEmpty] = createSignal(true)
  const [html, setHtml] = createSignal("")
  const [json, setJson] = createSignal<unknown>(undefined)
  const [text, setText] = createSignal("")

  const syncState = (e: Editor) => {
    setIsFocused(e.isFocused)
    setIsEmpty(e.isEmpty)
    setHtml(e.getHTML())
    setJson(e.getJSON())
    setText(e.getText())
  }

  const createEditor = (el: HTMLElement) => {
    if (editor()?.isDestroyed === false) {
      editor()?.destroy()
    }

    const baseOpts: Partial<EditorOptions> = {
      element: el,
      extensions: editorOptions.extensions ?? [],
      content: editorOptions.content ?? "",
      editable: editorOptions.editable ?? true,
      injectCSS: editorOptions.injectCSS ?? false,
      autofocus: editorOptions.autofocus ?? false,
      editorProps: editorOptions.editorProps ?? {},
      parseOptions: editorOptions.parseOptions ?? {},
      enableInputRules: editorOptions.enableInputRules ?? true,
      enablePasteRules: editorOptions.enablePasteRules ?? true,
      enableContentCheck: editorOptions.enableContentCheck ?? false,
      emitContentError: editorOptions.emitContentError ?? false,
    }

    if (editorOptions.textDirection !== undefined)
      baseOpts.textDirection = editorOptions.textDirection
    if (editorOptions.enableCoreExtensions !== undefined)
      baseOpts.enableCoreExtensions = editorOptions.enableCoreExtensions
    if (editorOptions.coreExtensionOptions !== undefined)
      baseOpts.coreExtensionOptions = editorOptions.coreExtensionOptions
    if (editorOptions.onBeforeCreate !== undefined)
      baseOpts.onBeforeCreate = (props) => editorOptions.onBeforeCreate!(props)
    if (editorOptions.onCreate !== undefined)
      baseOpts.onCreate = (props) => {
        setIsInitialized(true)
        syncState(props.editor)
        editorOptions.onCreate!(props)
      }
    else
      baseOpts.onCreate = (props) => {
        setIsInitialized(true)
        syncState(props.editor)
      }
    if (editorOptions.onMount !== undefined)
      baseOpts.onMount = (props) => {
        syncState(props.editor)
        editorOptions.onMount!(props)
      }
    else baseOpts.onMount = (props) => syncState(props.editor)
    if (editorOptions.onUnmount !== undefined)
      baseOpts.onUnmount = (props) => editorOptions.onUnmount!(props)
    if (editorOptions.onUpdate !== undefined)
      baseOpts.onUpdate = (props) => {
        syncState(props.editor)
        editorOptions.onUpdate!(props)
      }
    else baseOpts.onUpdate = (props) => syncState(props.editor)
    if (editorOptions.onSelectionUpdate !== undefined)
      baseOpts.onSelectionUpdate = (props) => {
        syncState(props.editor)
        editorOptions.onSelectionUpdate!(props)
      }
    else baseOpts.onSelectionUpdate = (props) => syncState(props.editor)
    if (editorOptions.onTransaction !== undefined)
      baseOpts.onTransaction = (props) => {
        syncState(props.editor)
        editorOptions.onTransaction!(props)
      }
    else baseOpts.onTransaction = (props) => syncState(props.editor)
    if (editorOptions.onFocus !== undefined)
      baseOpts.onFocus = (props) => {
        setIsFocused(true)
        editorOptions.onFocus!(props)
      }
    else baseOpts.onFocus = () => setIsFocused(true)
    if (editorOptions.onBlur !== undefined)
      baseOpts.onBlur = (props) => {
        setIsFocused(false)
        editorOptions.onBlur!(props)
      }
    else baseOpts.onBlur = () => setIsFocused(false)
    if (editorOptions.onDestroy !== undefined)
      baseOpts.onDestroy = (props) => {
        setIsInitialized(false)
        setIsFocused(false)
        editorOptions.onDestroy!(props)
      }
    else
      baseOpts.onDestroy = () => {
        setIsInitialized(false)
        setIsFocused(false)
      }
    if (editorOptions.onContentError !== undefined)
      baseOpts.onContentError = editorOptions.onContentError

    const instance = new Editor(baseOpts as EditorOptions)

    setEditor(instance)
    return instance
  }

  onMount(() => {
    if (immediate) {
      const el = element()
      if (el) {
        createEditor(el)
      }
    }
  })

  type SetContentArg = Parameters<Editor["commands"]["setContent"]>[0]

  createEffect(() => {
    const el = element()
    const currentEditor = editor()
    if (!el) return
    if (!currentEditor || currentEditor.isDestroyed) {
      createEditor(el)
    }
  })

  createEffect(() => {
    const currentEditor = editor()
    if (!currentEditor) return
    const content = editorOptions.content
    if (content !== undefined && content !== null) {
      const stringContent = typeof content === "string" ? content : JSON.stringify(content)
      const currentHtml = currentEditor.getHTML()
      if (stringContent !== currentHtml) {
        currentEditor.commands.setContent(content as SetContentArg, { emitUpdate: false })
      }
    }
  })

  createEffect(() => {
    const currentEditor = editor()
    if (!currentEditor) return
    const editable = editorOptions.editable
    if (editable !== undefined && editable !== currentEditor.isEditable) {
      currentEditor.setEditable(editable)
    }
  })

  onCleanup(() => {
    const currentEditor = editor()
    if (currentEditor && !currentEditor.isDestroyed) {
      currentEditor.destroy()
    }
    setEditor(null)
    setIsInitialized(false)
  })

  return {
    editor,
    isInitialized,
    isFocused,
    isEmpty,
    html,
    json,
    text,
  }
}

export type { Editor as TiptapEditor }
