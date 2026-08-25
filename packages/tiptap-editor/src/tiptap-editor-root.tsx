import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"
import {
  type ComponentProps,
  createComputed,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  Show,
  splitProps,
  type Accessor,
  type JSX,
  type Setter,
} from "solid-js"

import type { Editor } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"

import { TiptapEditorProvider, type TiptapEditorVisibility } from "./tiptap-editor-context"
import { HeadlessTiptapEditor } from "./tiptap-editor"
import type { HeadlessTiptapEditorProps } from "./tiptap-editor"
import { sx } from "./stylex"

const CONTENT_STYLE_SCOPE = "data-tbr-tiptap-content"
let contentStyleInjected = false

export function ensureTiptapContentStyles(targetDocument: Document = document) {
  if (contentStyleInjected) return
  const existing = targetDocument.querySelector(`style[${CONTENT_STYLE_SCOPE}]`)
  if (existing) {
    contentStyleInjected = true
    return
  }
  const style = targetDocument.createElement("style")
  style.setAttribute(CONTENT_STYLE_SCOPE, "")
  style.textContent = `
  [data-tbr-tiptap-root] .ProseMirror,
  [data-tbr-tiptap-root] [contenteditable="true"] {
    outline: none;
  }
  [data-tbr-tiptap-root] p { margin-block: 8px; }
  [data-tbr-tiptap-root] p.is-editor-empty:first-child::before {
    color: rgb(var(--tbr-color-text-subtle));
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
  [data-tbr-tiptap-root] h1 {
    font-size: 24px;
    font-weight: var(--tbr-font-bold);
    line-height: 1.25;
    margin-block: 16px;
  }
  [data-tbr-tiptap-root] h2 {
    font-size: 20px;
    font-weight: var(--tbr-font-semibold);
    line-height: 1.3;
    margin-block: 14px;
  }
  [data-tbr-tiptap-root] h3 {
    font-size: 16px;
    font-weight: var(--tbr-font-semibold);
    line-height: 1.4;
    margin-block: 12px;
  }
  [data-tbr-tiptap-root] ul,
  [data-tbr-tiptap-root] ol {
    padding-left: 24px;
    margin-block: 8px;
  }
  [data-tbr-tiptap-root] li { margin-block: 2px; }
  [data-tbr-tiptap-root] li p { margin-block: 2px; }
  [data-tbr-tiptap-root] blockquote {
    border-left-color: rgb(var(--tbr-color-accent));
    border-left-style: solid;
    border-left-width: 3px;
    color: rgb(var(--tbr-color-text-muted));
    margin-block: 10px;
    margin-inline: 0;
    padding-left: 14px;
  }
  [data-tbr-tiptap-root] blockquote p { margin-block: 4px; }
  [data-tbr-tiptap-root] code {
    background-color: rgb(var(--tbr-color-surface-soft));
    border-radius: var(--tbr-radius-r1);
    color: rgb(var(--tbr-color-accent));
    font-family: var(--tbr-font-mono);
    font-size: 12px;
    padding-block: 1px;
    padding-inline: 4px;
  }
  [data-tbr-tiptap-root] pre {
    background-color: color-mix(in srgb, rgb(var(--tbr-color-surface-soft)) 80%, black);
    border-radius: var(--tbr-radius-r2);
    color: rgb(var(--tbr-color-text));
    font-family: var(--tbr-font-mono);
    font-size: 12px;
    line-height: 1.5;
    margin-block: 10px;
    overflow-x: auto;
    padding: 10px;
  }
  [data-tbr-tiptap-root] pre code {
    background-color: transparent;
    border-radius: 0;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    padding: 0;
  }
  [data-tbr-tiptap-root] a {
    color: rgb(var(--tbr-color-accent));
    text-decoration: underline;
    cursor: pointer;
  }
  [data-tbr-tiptap-root] a:hover {
    color: rgb(var(--tbr-color-accent-hover));
  }
  [data-tbr-tiptap-root] hr {
    border-style: none;
    border-top-color: rgb(var(--tbr-color-line));
    border-top-style: solid;
    border-top-width: 1px;
    margin-block: 16px;
    margin-inline: 0;
  }
  [data-tbr-tiptap-root] img {
    border-radius: var(--tbr-radius-r2);
    height: auto;
    margin-block: 10px;
    max-width: 100%;
  }
  [data-tbr-tiptap-root] [data-type="taskList"] {
    list-style: none;
    padding-left: 0;
  }
  [data-tbr-tiptap-root] [data-type="taskList"] li {
    align-items: flex-start;
    display: flex;
    gap: 6px;
  }
  [data-tbr-tiptap-root] [data-type="taskList"] li p { margin-block: 0; }
  [data-tbr-tiptap-root] [data-type="taskList"] li > label {
    align-items: center;
    display: flex;
    flex-shrink: 0;
    height: 18px;
    margin-top: 2px;
  }
  [data-tbr-tiptap-root] [data-type="taskList"] li > label input {
    height: 14px;
    width: 14px;
    accent-color: rgb(var(--tbr-color-accent));
    cursor: pointer;
  }
  [data-tbr-tiptap-root] [data-type="taskList"] li > div {
    flex: 1;
    min-width: 0;
  }
  [data-tbr-tiptap-root] [data-type="taskList"] li[data-checked="true"] p {
    color: rgb(var(--tbr-color-text-subtle));
    text-decoration: line-through;
  }
`
  targetDocument.head.append(style)
  contentStyleInjected = true
}

const primitiveStyles = stylex.create({
  contentSlot: {
    width: "100%",
    height: "100%",
  },
})

export type TiptapEditorSize = "sm" | "md"

export type TiptapEditorRootProps = Omit<Partial<ComponentProps<"div">>, "onChange" | "children"> &
  Pick<
    HeadlessTiptapEditorProps,
    | "content"
    | "editable"
    | "placeholder"
    | "autofocus"
    | "onReady"
    | "onUpdate"
    | "onFocus"
    | "onBlur"
    | "onCreate"
    | "onDestroy"
  > & {
    size?: TiptapEditorSize | undefined
    invalid?: boolean | undefined
    disabled?: boolean | undefined
    extensions?: HeadlessTiptapEditorProps["extensions"]
    visibility?: TiptapEditorVisibility | undefined
    onChange?: ((html: string) => void) | undefined
    onVisibilityChange?: ((v: TiptapEditorVisibility) => void) | undefined
    onSave?: ((html: string, ctx: { visibility: TiptapEditorVisibility }) => void) | undefined
    onInsert?: ((kind: TiptapEditorInsertKind) => void) | undefined
    xstyleRoot?: StyleXStyles | undefined
    children?: JSX.Element
    rootAttrs?: SolidAttrs<HTMLElement> | undefined
    contentAttrs?: SolidAttrs<HTMLElement> | undefined
  }

export type TiptapEditorInsertKind =
  | "media"
  | "audio"
  | "file"
  | "link"
  | "location"
  | "toggle-focus"
  | "toggle-format-toolbar"

export type SolidAttrs<T extends HTMLElement> = {
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  ref?: ((el: T) => void) | { el: T | null } | undefined
}

export type RootState = {
  editor: Accessor<Editor | null>
  setEditor: Setter<Editor | null>
  value: Accessor<string>
  setValue: Setter<string>
  visibility: Accessor<TiptapEditorVisibility>
  setVisibility: Setter<TiptapEditorVisibility>
  formatToolbarVisible: Accessor<boolean>
  setFormatToolbarVisible: Setter<boolean>
  focusMode: Accessor<boolean>
  setFocusMode: Setter<boolean>
  initialized: Accessor<boolean>
  focused: Accessor<boolean>
  setFocused: Setter<boolean>
  empty: Accessor<boolean>
  editable: Accessor<boolean>
  disabled: Accessor<boolean>
  size: Accessor<TiptapEditorSize>
  invalid: Accessor<boolean>
  extensions: Accessor<HeadlessTiptapEditorProps["extensions"]>
}

export function createTiptapEditorRootState(
  options: Pick<
    TiptapEditorRootProps,
    | "content"
    | "editable"
    | "disabled"
    | "size"
    | "invalid"
    | "extensions"
    | "placeholder"
    | "visibility"
    | "onChange"
  > & {
    onCreateEditor?: (e: Editor) => void
    onUpdateHtml?: (html: string) => void
  } = {},
): RootState & {
  handleReady: (editor: Editor) => void
  handleUpdate: (e: { editor: Editor }) => void
  extensionsList: Accessor<HeadlessTiptapEditorProps["extensions"]>
} {
  const [editor, setEditor] = createSignal<Editor | null>(null)
  const [value, setValue] = createSignal<string>(
    typeof options.content === "string" ? options.content : "",
  )
  const [visibility, setVisibility] = createSignal<TiptapEditorVisibility>(
    options.visibility ?? "private",
  )
  const [formatToolbarVisible, setFormatToolbarVisible] = createSignal(true)
  const [focusMode, setFocusMode] = createSignal(false)
  const [initialized, setInitialized] = createSignal(false)
  const [focused, setFocused] = createSignal(false)
  const [empty, setEmpty] = createSignal(
    typeof options.content === "string" ? options.content.length === 0 : true,
  )
  const editable = createMemo(() => (options.editable ?? true) && !(options.disabled ?? false))
  const disabled = createMemo(() => options.disabled ?? false)
  const size = createMemo<TiptapEditorSize>(() => options.size ?? "md")
  const invalid = createMemo(() => options.invalid ?? false)
  const extensions = createMemo<HeadlessTiptapEditorProps["extensions"]>(
    () => options.extensions ?? [],
  )

  const baseExtList = createMemo<HeadlessTiptapEditorProps["extensions"]>(() => [
    StarterKit,
    Underline,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Link.configure({ openOnClick: false, autolink: true }),
    Image.configure({ inline: false, allowBase64: true }),
    Placeholder.configure({
      placeholder: options.placeholder ?? "开始输入内容…",
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
  ])

  const extensionsList = createMemo<HeadlessTiptapEditorProps["extensions"]>(() => {
    const base = baseExtList() ?? []
    const extra = extensions()
    if (Array.isArray(extra) && extra.length > 0) return [...base, ...extra]
    return base
  })

  const handleReady = (e: Editor) => {
    setEditor(e)
    setInitialized(true)
    setEmpty(e.isEmpty)
    options.onCreateEditor?.(e)
  }

  const handleUpdate = (e: { editor: Editor }) => {
    const html = e.editor.getHTML()
    setValue(html)
    setEmpty(e.editor.isEmpty)
    options.onUpdateHtml?.(html)
    options.onChange?.(html)
  }

  createEffect(() => {
    if (typeof document !== "undefined") ensureTiptapContentStyles(document)
  })

  return {
    editor,
    setEditor,
    value,
    setValue,
    visibility,
    setVisibility,
    formatToolbarVisible,
    setFormatToolbarVisible,
    focusMode,
    setFocusMode,
    initialized,
    focused,
    setFocused,
    empty,
    editable,
    disabled,
    size,
    invalid,
    extensions,
    extensionsList,
    handleReady,
    handleUpdate,
  }
}

export function TiptapEditorRoot(props: TiptapEditorRootProps) {
  const [local, rest] = splitProps(props, [
    "size",
    "invalid",
    "extensions",
    "content",
    "editable",
    "placeholder",
    "autofocus",
    "onReady",
    "onCreate",
    "onDestroy",
    "onUpdate",
    "onFocus",
    "onBlur",
    "onChange",
    "disabled",
    "visibility",
    "onVisibilityChange",
    "xstyleRoot",
    "children",
    "rootAttrs",
    "contentAttrs",
  ])

  const state = createTiptapEditorRootState({
    content: local.content,
    editable: local.editable,
    disabled: local.disabled,
    size: local.size,
    invalid: local.invalid,
    extensions: local.extensions,
    placeholder: local.placeholder,
    visibility: local.visibility,
    onChange: local.onChange,
    onCreateEditor: (e) => {
      local.onReady?.(e)
    },
  })

  createComputed(() => {
    const v = state.visibility()
    local.onVisibilityChange?.(v)
  })

  const focusTracker: HeadlessTiptapEditorProps["onFocus"] = ((e: any) => {
    state.setFocused(true)
    ;(local.onFocus as any)?.(e)
  }) as HeadlessTiptapEditorProps["onFocus"]
  const blurTracker: HeadlessTiptapEditorProps["onBlur"] = ((e: any) => {
    state.setFocused(false)
    ;(local.onBlur as any)?.(e)
  }) as HeadlessTiptapEditorProps["onBlur"]

  onMount(() => {
    if (typeof document !== "undefined") ensureTiptapContentStyles(document)
  })

  const rootAttrs = (): SolidAttrs<HTMLElement> =>
    local.rootAttrs ??
    ({ class: props.class, style: props.style as any } as SolidAttrs<HTMLElement>)

  const contentAttrs = (): SolidAttrs<HTMLElement> => local.contentAttrs ?? {}

  return (
    <TiptapEditorProvider
      editor={state.editor}
      editable={state.editable}
      disabled={state.disabled}
      empty={state.empty}
      initialized={state.initialized}
      focused={state.focused}
      value={state.value}
      visibility={state.visibility}
      setVisibility={(v) => state.setVisibility(v)}
      formatToolbarVisible={state.formatToolbarVisible}
      setFormatToolbarVisible={(v) => state.setFormatToolbarVisible(v)}
      focusMode={state.focusMode}
      setFocusMode={(v) => state.setFocusMode(v)}
      extensions={state.extensionsList}
      size={state.size}
      invalid={state.invalid}
    >
      <div
        {...(rest as any)}
        data-tbr-tiptap-root=""
        data-tiptap-size={state.size()}
        data-tiptap-invalid={state.invalid() ? "true" : undefined}
        data-tiptap-disabled={state.disabled() ? "true" : undefined}
        data-tiptap-focus-mode={state.focusMode() ? "true" : undefined}
        class={rootAttrs().class}
        style={rootAttrs().style as JSX.CSSProperties | undefined}
        ref={rootAttrs().ref as any}
      >
        <Show when={!props.children}>
          <div
            {...sx(primitiveStyles.contentSlot)}
            class={contentAttrs().class}
            style={{
              ...(sx(primitiveStyles.contentSlot).style as any),
              ...(contentAttrs().style as any),
            }}
            ref={contentAttrs().ref as any}
          >
            <HeadlessTiptapEditor
              extensions={state.extensionsList()}
              content={local.content}
              editable={state.editable()}
              autofocus={local.autofocus}
              onReady={state.handleReady}
              onCreate={local.onCreate}
              onDestroy={local.onDestroy}
              onUpdate={state.handleUpdate}
              onFocus={focusTracker}
              onBlur={blurTracker}
            />
          </div>
        </Show>
        {props.children}
      </div>
    </TiptapEditorProvider>
  )
}

export function useTiptapEditorRootContent(
  _props: {
    contentAttrs?: SolidAttrs<HTMLElement>
  } = {},
): {
  headlessProps: Partial<HeadlessTiptapEditorProps> & {
    extensions: HeadlessTiptapEditorProps["extensions"]
  }
  contentAttrs: SolidAttrs<HTMLElement>
  state: RootState
  wrap: (node: JSX.Element) => JSX.Element
} {
  const ctx = (globalThis as unknown as { __tiptapBuildTimeAssertion: string })
    .__tiptapBuildTimeAssertion
  void ctx
  throw new Error(
    "[@tabora/tiptap-editor] useTiptapEditorRootContent is reserved; use the Root children slot with HeadlessTiptapEditor directly.",
  )
}

export default TiptapEditorRoot
