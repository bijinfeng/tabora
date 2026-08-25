import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"
import {
  type ComponentProps,
  createEffect,
  createSignal,
  onMount,
  Show,
  splitProps,
} from "solid-js"

import { color, motion, radius } from "@tabora/theme/tokens.stylex"

import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import type { Editor } from "@tiptap/core"

import { HeadlessTiptapEditor } from "./tiptap-editor"
import type { HeadlessTiptapEditorProps } from "./tiptap-editor"
import { Toolbar, defaultToolbar, type ToolbarGroupConfig } from "./tiptap-editor-toolbar"
import { joinClassNames } from "./stylex"

const CONTENT_STYLE_SCOPE = "data-tbr-tiptap-content"
let contentStyleInjected = false

function ensureTiptapContentStyles(targetDocument: Document = document) {
  if (contentStyleInjected) return
  const existing = targetDocument.querySelector(`style[${CONTENT_STYLE_SCOPE}]`)
  if (existing) {
    contentStyleInjected = true
    return
  }
  const style = targetDocument.createElement("style")
  style.setAttribute(CONTENT_STYLE_SCOPE, "")
  style.textContent = `
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

const styles = stylex.create({
  root: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transitionDuration: motion.fast,
    transitionProperty: "border-color, box-shadow",
    transitionTimingFunction: motion.ease,
    width: "100%",
    ":focus-within": {
      borderColor: color.accent,
      boxShadow: "0 0 0 3px rgb(var(--tbr-color-accent) / 0.12)",
    },
  },
  rootSm: {
    borderRadius: radius.control,
  },
  rootMd: {
    borderRadius: radius.control,
  },
  rootInvalid: {
    borderColor: color.danger,
    ":focus-within": {
      borderColor: color.danger,
      boxShadow: "0 0 0 3px rgb(var(--tbr-color-danger) / 0.12)",
    },
  },
  rootDisabled: {
    backgroundColor: color.surfaceSoft,
    cursor: "not-allowed",
    opacity: 0.5,
  },
  contentWrapper: {
    minHeight: 120,
    width: "100%",
  },
  content: {
    color: color.text,
    fontFamily: "inherit",
    fontSize: 13,
    lineHeight: 1.6,
    minHeight: 120,
    outline: "none",
    paddingBlock: 12,
    paddingInline: 14,
    width: "100%",
  },
  contentSm: {
    fontSize: 12,
    minHeight: 80,
    paddingBlock: 8,
    paddingInline: 10,
  },
  contentMd: {
    fontSize: 13,
    minHeight: 120,
    paddingBlock: 12,
    paddingInline: 14,
  },
})

export type TiptapEditorSize = "sm" | "md"

export type TiptapEditorProps = Omit<ComponentProps<"div">, "onChange" | "children"> &
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
    size?: TiptapEditorSize
    invalid?: boolean
    disabled?: boolean
    extensions?: HeadlessTiptapEditorProps["extensions"]
    xstyle?: StyleXStyles
    onChange?: (html: string) => void
    toolbarItems?: ToolbarGroupConfig[]
    uploadImage?: ((file: File) => Promise<string>) | undefined
    xstyleToolbar?: StyleXStyles
    xstyleContent?: StyleXStyles
  }

export function TiptapEditor(props: TiptapEditorProps) {
  const [local, rest] = splitProps(props, [
    "size",
    "invalid",
    "extensions",
    "content",
    "editable",
    "placeholder",
    "autofocus",
    "onReady",
    "onUpdate",
    "onFocus",
    "onBlur",
    "onCreate",
    "onDestroy",
    "onChange",
    "toolbarItems",
    "uploadImage",
    "xstyle",
    "xstyleToolbar",
    "xstyleContent",
    "class",
    "disabled",
  ])

  const [editorRef, setEditorRef] = createSignal<Editor | null>(null)

  onMount(() => {
    ensureTiptapContentStyles(document)
  })

  createEffect(() => {
    if (typeof document !== "undefined") ensureTiptapContentStyles(document)
  })

  const extensionsList: HeadlessTiptapEditorProps["extensions"] = [
    StarterKit,
    Underline,
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
    }),
    Image.configure({
      inline: false,
      allowBase64: true,
    }),
    Placeholder.configure({
      placeholder: local.placeholder ?? "开始输入内容…",
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    ...(local.extensions ?? []),
  ]

  const handleUpdate: HeadlessTiptapEditorProps["onUpdate"] = (e) => {
    local.onUpdate?.(e)
    local.onChange?.(e.editor.getHTML())
  }

  const rootCompiled = () =>
    stylex.attrs(
      styles.root,
      (local.size === "sm" || !local.size) && styles.rootSm,
      local.size === "md" && styles.rootMd,
      local.invalid && styles.rootInvalid,
      (local.disabled || local.editable === false) && styles.rootDisabled,
      local.xstyle,
    )

  const contentCompiled = () =>
    stylex.attrs(
      styles.contentWrapper,
      styles.content,
      (local.size === "sm" || !local.size) && styles.contentSm,
      local.size === "md" && styles.contentMd,
      local.xstyleContent,
    )

  return (
    <div
      {...rest}
      data-tbr-tiptap-root=""
      class={joinClassNames(rootCompiled().class, local.class)}
      style={undefined}
    >
      <Show when={local.editable !== false && !local.disabled}>
        <Toolbar
          editor={editorRef}
          groups={local.toolbarItems ?? defaultToolbar}
          uploadImage={local.uploadImage}
          xstyle={local.xstyleToolbar}
        />
      </Show>
      <div class={contentCompiled().class}>
        <HeadlessTiptapEditor
          extensions={extensionsList}
          content={local.content}
          editable={local.editable !== false && !local.disabled}
          autofocus={local.autofocus}
          onReady={(e) => {
            setEditorRef(e)
            local.onReady?.(e)
          }}
          onCreate={local.onCreate}
          onDestroy={local.onDestroy}
          onUpdate={handleUpdate}
          onFocus={local.onFocus}
          onBlur={local.onBlur}
        />
      </div>
    </div>
  )
}

export default TiptapEditor
export type { Editor as TiptapEditorInstance } from "@tiptap/core"
export type { HeadlessTiptapEditorProps }
export type {
  ToolbarGroupConfig,
  ToolbarItemConfig,
  ToolbarCommand,
  ToolbarContext,
} from "./tiptap-editor-toolbar"
export {
  Toolbar,
  defaultToolbar,
  commandIsActive,
  commandCanExecute,
  executeCommand,
} from "./tiptap-editor-toolbar"
