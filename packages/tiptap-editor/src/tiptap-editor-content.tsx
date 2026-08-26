import { createSignal, type JSX, splitProps, type Accessor } from "solid-js"
import type { Editor } from "@tiptap/core"
import { useTiptapEditorContext } from "./tiptap-editor-context"
import { HeadlessTiptapEditor } from "./tiptap-editor"
import type { HeadlessTiptapEditorProps } from "./tiptap-editor"
import type { SolidAttrs } from "./tiptap-editor-root"
import { sx } from "./stylex"
import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

const _ = stylex.create({ empty: {} })

export type TiptapEditorContentProps = Omit<
  HeadlessTiptapEditorProps,
  "extensions" | "editable"
> & {
  xstyle?: StyleXStyles | ReturnType<typeof stylex.attrs>
  attrs?: SolidAttrs<HTMLElement>
  minHeight?: number | string | undefined
  insertDialog?: ((editor: Accessor<Editor | null>) => JSX.Element) | undefined
}

export function TiptapEditorContent(props: TiptapEditorContentProps) {
  const ctx = useTiptapEditorContext()
  const [local, headlessRest] = splitProps(props, [
    "xstyle",
    "attrs",
    "minHeight",
    "insertDialog",
    "onReady",
    "onCreate",
    "onDestroy",
    "onUpdate",
    "onFocus",
    "onBlur",
  ])

  const wrapAttrs = (): SolidAttrs<HTMLElement> => {
    const user = local.attrs
    if (user) return user
    const compiled = sx(local.xstyle ?? _.empty)
    const baseStyle: JSX.CSSProperties = {
      width: "100%",
      height: "100%",
      "min-height":
        typeof local.minHeight === "number" ? `${local.minHeight}px` : (local.minHeight ?? "auto"),
      ...(compiled.style as JSX.CSSProperties | undefined),
    }
    return {
      class: compiled.class ?? undefined,
      style: baseStyle,
    }
  }

  const w = wrapAttrs()
  const [editor, setEditor] = createSignal<Editor | null>(null)

  const handleReady: HeadlessTiptapEditorProps["onReady"] = (e) => {
    setEditor(e)
    queueMicrotask(() => {
      if (!e.isDestroyed && e.view.dom.isConnected) ctx.registerEditor(e)
    })
    local.onReady?.(e)
  }
  const handleUpdate: HeadlessTiptapEditorProps["onUpdate"] = (e) => {
    ctx.reportEditorUpdate(e)
    local.onUpdate?.(e)
  }

  return (
    <div class={w.class} style={w.style as JSX.CSSProperties | undefined} ref={w.ref as any}>
      <HeadlessTiptapEditor
        {...headlessRest}
        extensions={ctx.extensions()}
        editable={ctx.editable()}
        onReady={handleReady}
        onUpdate={handleUpdate}
        onCreate={local.onCreate}
        onDestroy={local.onDestroy}
        onFocus={local.onFocus}
        onBlur={local.onBlur}
      />
      {local.insertDialog?.(editor)}
    </div>
  )
}

export default TiptapEditorContent
