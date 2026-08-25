import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"
import {
  type ComponentProps,
  createEffect,
  createSignal,
  onMount,
  Show,
  splitProps,
  type JSX,
} from "solid-js"

import { color, font, motion, radius, space } from "@tabora/theme/tokens.stylex"

import type { HeadlessTiptapEditorProps } from "./tiptap-editor"
import {
  Toolbar,
  defaultToolbar,
  compactToolbar,
  type ToolbarGroupConfig,
} from "./tiptap-editor-toolbar"

import {
  TiptapEditorRoot,
  type TiptapEditorSize,
  type TiptapEditorInsertKind,
  ensureTiptapContentStyles,
} from "./tiptap-editor-root"
import { useTiptapEditorContext, type TiptapEditorVisibility } from "./tiptap-editor-context"
import { TiptapEditorContent } from "./tiptap-editor-content"
import { TiptapEditorActions, type TiptapEditorActionInsertItem } from "./tiptap-editor-actions"
import {
  buildInsertMenuItems,
  defaultInsertMenuItems,
  type TiptapEditorInsertMenuItem,
} from "./tiptap-editor-insert-menu"
import { TiptapEditorFocusShell, TiptapEditorFocusEntry } from "./tiptap-editor-focus-shell"
import { joinClassNames, sx } from "./stylex"

const styles = stylex.create({
  rootBase: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transitionDuration: motion.fast,
    transitionProperty: "border-color, box-shadow, width, height, margin, border-radius",
    transitionTimingFunction: motion.ease,
    width: "100%",
    minWidth: 0,
    ":focus-within": {
      borderColor: color.accent,
      boxShadow: "0 0 0 3px rgb(var(--tbr-color-accent) / 0.12)",
    },
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
  rootRoundedCard: {
    borderRadius: radius.card,
  },
  rootPaddingSm: {
    paddingBlock: space.s2,
  },
  contentShell: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    flex: "1 1 auto",
    minHeight: 0,
  },
  contentWrapper: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
    minHeight: 0,
  },
  content: {
    color: color.text,
    fontFamily: "inherit",
    fontSize: 13,
    lineHeight: 1.6,
    outline: "none",
    paddingBlock: space.s4,
    paddingInline: space.s5,
    width: "100%",
    minHeight: 120,
    flex: "1 1 auto",
  },
  contentSm: {
    fontSize: 12,
    minHeight: 80,
    paddingBlock: space.s3,
    paddingInline: space.s4,
  },
  contentMd: {
    fontSize: 13,
    minHeight: 120,
    paddingBlock: space.s4,
    paddingInline: space.s5,
  },
  placeholder: {
    fontSize: 18,
  },
  actionsBar: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    paddingBlock: space.s4,
    paddingInline: space.s4,
    gap: space.s4,
    borderTopColor: "transparent",
    borderTopStyle: "solid",
    borderTopWidth: 0,
  },
  actionsLeft: {
    alignItems: "center",
    display: "flex",
    gap: space.s3,
  },
  actionsRight: {
    alignItems: "center",
    display: "flex",
    gap: space.s3,
  },
  insertButton: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.text,
    height: 32,
    width: 32,
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color, transform",
    transitionTimingFunction: motion.ease,
    ":hover": {
      backgroundColor: color.surfaceHover,
      borderColor: color.lineStrong,
      color: color.accent,
      transform: "translateY(-0.5px)",
    },
    ":active": {
      transform: "translateY(0)",
    },
    ":focus-visible": {
      boxShadow: "0 0 0 4px rgb(var(--tbr-color-accent) / 0.18)",
      outline: `2px solid ${color.focus}`,
      outlineOffset: 2,
    },
  },
  visibilityTrigger: {
    alignItems: "center",
    backgroundColor: color.accentSoft,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "transparent",
    columnGap: 6,
    display: "inline-flex",
    fontSize: 13,
    height: 32,
    paddingBlock: 0,
    paddingInline: 12,
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color, transform",
    transitionTimingFunction: motion.ease,
    ":hover": {
      backgroundColor:
        "color-mix(in srgb, rgb(var(--tbr-color-accent-soft)) 78%, rgb(var(--tbr-color-surface-hover)))",
      transform: "translateY(-0.5px)",
    },
    ":active": {
      transform: "translateY(0)",
    },
    ":focus-visible": {
      boxShadow: "0 0 0 4px rgb(var(--tbr-color-accent) / 0.18)",
      outline: `2px solid ${color.focus}`,
      outlineOffset: 2,
    },
  },
  saveButton: {
    minWidth: 96,
  },
  toolbarCompact: {
    borderBottomWidth: 0,
    backgroundColor: "transparent",
    paddingBlock: space.s3,
    paddingInline: space.s4,
    borderBottomColor: "transparent",
    gap: 6,
  },
  toolbarStandard: {
    paddingBlock: space.s3,
    paddingInline: space.s4,
    gap: 6,
    backgroundColor: "transparent",
    borderBottomColor: color.line,
    borderBottomWidth: 1,
  },
  focusOverlay: {
    backgroundColor: "color-mix(in srgb, rgb(var(--tbr-color-bg-gray)) 88%, black)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingBlock: 40,
    paddingInline: 20,
    position: "fixed",
    inset: 0,
    zIndex: 120,
    overflow: "auto",
  },
  focusCard: {
    position: "relative",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 20px 60px -20px rgb(0 0 0 / 0.35), 0 8px 24px -8px rgb(0 0 0 / 0.25)",
    width: "min(960px, 100%)",
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    minHeight: "min(80vh, 900px)",
    overflow: "hidden",
  },
  focusExit: {
    position: "absolute",
    top: space.s4,
    right: space.s4,
    zIndex: 2,
  },
  actionsVisibilityText: {
    color: color.accent,
    fontSize: 13,
    fontWeight: font.semibold,
  },
  actionsVisibilityChevron: {
    color: color.accent,
  },
})

type TiptapEditorVariant = "minimal" | "standard" | "standard-with-menu" | "focus"

export type TiptapEditorProps = Omit<Partial<ComponentProps<"div">>, "onChange" | "children"> &
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
    xstyle?: StyleXStyles | undefined
    onChange?: ((html: string) => void) | undefined
    toolbarItems?: ToolbarGroupConfig[] | undefined
    uploadImage?: ((file: File) => Promise<string>) | undefined
    xstyleToolbar?: StyleXStyles | undefined
    xstyleContent?: StyleXStyles | undefined
    xstyleActions?: StyleXStyles | undefined
    variant?: TiptapEditorVariant | undefined
    visibility?: TiptapEditorVisibility | undefined
    onVisibilityChange?: ((v: TiptapEditorVisibility) => void) | undefined
    showToolbar?: boolean | undefined
    showActions?: boolean | undefined
    actions?: JSX.Element | undefined
    showSaveButton?: boolean | undefined
    saveLabel?: JSX.Element | undefined
    saveDisabled?: boolean | undefined
    saveLoading?: boolean | undefined
    onSave?: ((html: string, ctx: { visibility: TiptapEditorVisibility }) => void) | undefined
    insertMenuItems?: TiptapEditorActionInsertItem[] | undefined
    insertMenuPrimitiveItems?: TiptapEditorInsertMenuItem[] | undefined
    onInsertKind?: ((kind: TiptapEditorInsertKind) => void) | undefined
    focusMode?: boolean | undefined
    onFocusModeChange?: ((open: boolean) => void) | undefined
    contentMinHeight?: number | string | undefined
  }

const VARIANT_DEFAULT_TOOLBAR: Record<TiptapEditorVariant, ToolbarGroupConfig[]> = {
  minimal: [],
  standard: compactToolbar,
  "standard-with-menu": compactToolbar,
  focus: defaultToolbar,
}

function variantDefaultCardStyle(v: TiptapEditorVariant): StyleXStyles | undefined {
  switch (v) {
    case "standard":
    case "standard-with-menu":
    case "focus":
      return styles.rootRoundedCard
    default:
      return undefined
  }
}

export function StyledTiptapEditor(props: TiptapEditorProps) {
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
    "xstyleActions",
    "variant",
    "visibility",
    "onVisibilityChange",
    "showToolbar",
    "showActions",
    "actions",
    "showSaveButton",
    "saveLabel",
    "saveDisabled",
    "saveLoading",
    "onSave",
    "insertMenuItems",
    "insertMenuPrimitiveItems",
    "onInsertKind",
    "focusMode",
    "onFocusModeChange",
    "contentMinHeight",
    "class",
    "disabled",
  ])

  const [editorRef, setEditorRef] = createSignal<
    Parameters<NonNullable<HeadlessTiptapEditorProps["onReady"]>>[0] | null
  >(null)
  const [htmlOut, setHtmlOut] = createSignal<string>(
    typeof local.content === "string" ? local.content : "",
  )
  const [focusOpen, setFocusOpen] = createSignal<boolean>(local.focusMode ?? false)

  onMount(() => {
    ensureTiptapContentStyles(document)
  })

  createEffect(() => {
    if (typeof document !== "undefined") ensureTiptapContentStyles(document)
  })

  createEffect(() => {
    if (local.focusMode !== undefined) setFocusOpen(local.focusMode)
  })

  const variant = (): TiptapEditorVariant => local.variant ?? "standard"
  const showToolbar = () => {
    if (local.showToolbar !== undefined) return local.showToolbar
    const v = variant()
    return v === "standard" || v === "standard-with-menu" || v === "focus"
  }
  const showActions = () => (local.showActions === undefined ? true : local.showActions)
  const hasInsertMenu = () =>
    variant() === "standard-with-menu" ||
    !!local.insertMenuItems ||
    !!local.insertMenuPrimitiveItems
  const isFocusVariant = () => variant() === "focus"

  const rootCompiled = () =>
    stylex.attrs(
      styles.rootBase,
      variantDefaultCardStyle(variant()),
      local.invalid && styles.rootInvalid,
      (local.disabled || local.editable === false) && styles.rootDisabled,
      local.xstyle,
    )

  const toolbarStyleCompiled = () =>
    stylex.attrs(variant() === "minimal" ? undefined : styles.toolbarStandard, local.xstyleToolbar)

  const contentStyleCompiled = () =>
    stylex.attrs(
      styles.contentWrapper,
      styles.content,
      (local.size === "sm" || !local.size) && styles.contentSm,
      local.size === "md" && styles.contentMd,
      local.xstyleContent,
    )

  const actionsBarStyleCompiled = () => stylex.attrs(styles.actionsBar, local.xstyleActions)

  const toolbarGroups = (): ToolbarGroupConfig[] => {
    if (local.toolbarItems) return local.toolbarItems
    return VARIANT_DEFAULT_TOOLBAR[variant()]
  }

  const insertItemsFromPrimitives = (): TiptapEditorActionInsertItem[] | undefined => {
    if (local.insertMenuItems) return local.insertMenuItems
    if (!local.insertMenuPrimitiveItems && !hasInsertMenu()) return undefined
    const source = local.insertMenuPrimitiveItems ?? defaultInsertMenuItems
    return source
      .filter((x): x is Extract<(typeof source)[number], { kind: "item" }> => x.kind === "item")
      .map((x) => ({
        id: x.id,
        label: x.label,
        icon: x.icon,
        onClick: () => {
          const kind = x.onKind
          if (kind === "toggle-focus") {
            toggleFocusMode()
          } else if (kind === "toggle-format-toolbar") {
            // format toolbar 开关由 primitive 使用 context 管理；styled 层仅在 primitive 组合时消费
            x.onClick?.()
          } else {
            local.onInsertKind?.(kind as TiptapEditorInsertKind)
            x.onClick?.()
          }
        },
      }))
  }

  const toggleFocusMode = () => {
    const next = !focusOpen()
    setFocusOpen(next)
    local.onFocusModeChange?.(next)
  }

  const saveHtml = () => {
    if (!local.onSave) return
    const visibility: TiptapEditorVisibility = local.visibility ?? "private"
    local.onSave(htmlOut(), { visibility })
  }

  const disabled = () => (local.disabled ?? false) || local.editable === false

  const renderCore = (): JSX.Element => (
    <TiptapEditorRoot
      {...rest}
      class={joinClassNames(rootCompiled().class, local.class)}
      style={undefined}
      extensions={local.extensions}
      content={local.content}
      editable={local.editable}
      placeholder={local.placeholder}
      autofocus={local.autofocus}
      size={local.size}
      invalid={local.invalid}
      disabled={disabled()}
      visibility={(local.visibility ?? focusOpen()) ? local.visibility : undefined}
      onVisibilityChange={(v) => local.onVisibilityChange?.(v)}
      onChange={(html) => {
        setHtmlOut(html)
        local.onChange?.(html)
      }}
      onReady={(e) => {
        setEditorRef(e)
        local.onReady?.(e)
      }}
      onCreate={local.onCreate}
      onDestroy={local.onDestroy}
      onUpdate={(e) => {
        local.onUpdate?.(e)
      }}
      onFocus={local.onFocus}
      onBlur={local.onBlur}
    >
      <div {...sx(styles.contentShell)}>
        <Show when={showToolbar() && toolbarGroups().length > 0}>
          <Toolbar
            editor={editorRef}
            groups={toolbarGroups()}
            uploadImage={local.uploadImage}
            xstyle={toolbarStyleCompiled()}
          />
        </Show>

        <TiptapEditorContent
          onReady={(e) => {
            if (!editorRef()) setEditorRef(e)
          }}
          minHeight={local.contentMinHeight}
          xstyle={contentStyleCompiled()}
        />

        <Show when={showActions()}>
          <div {...actionsBarStyleCompiled()}>
            <Show
              when={local.actions !== undefined && local.actions !== null}
              fallback={
                <TiptapEditorActions
                  showInsert={true}
                  showSave={local.showSaveButton !== false}
                  saveLabel={local.saveLabel ?? "保存"}
                  saveDisabled={local.saveDisabled}
                  saveLoading={local.saveLoading}
                  onSave={saveHtml}
                  insertItems={insertItemsFromPrimitives()}
                  xstyle={undefined}
                  attrs={{
                    class: undefined,
                    style: { display: "contents" },
                  }}
                >
                  <Show when={isFocusVariant() && !focusOpen()}>
                    <TiptapEditorFocusEntry onClick={toggleFocusMode} />
                  </Show>
                </TiptapEditorActions>
              }
            >
              {local.actions}
            </Show>
          </div>
        </Show>
      </div>
    </TiptapEditorRoot>
  )

  const renderWithFocus = (): JSX.Element => (
    <>
      {renderCore()}
      <TiptapEditorFocusShell
        open={focusOpen()}
        onOpenChange={(next) => {
          setFocusOpen(next)
          local.onFocusModeChange?.(next)
        }}
        xstyleOverlay={styles.focusOverlay}
        xstyleCard={styles.focusCard}
      >
        {renderFocusInnerCard()}
      </TiptapEditorFocusShell>
    </>
  )

  const renderFocusInnerCard = (): JSX.Element => {
    const actionsBarC = stylex.attrs(styles.actionsBar)
    const toolbarC = stylex.attrs(styles.toolbarStandard, local.xstyleToolbar)
    const contentC = stylex.attrs(
      styles.contentWrapper,
      styles.content,
      styles.contentMd,
      local.xstyleContent,
    )
    return (
      <TiptapEditorRoot
        extensions={local.extensions}
        content={local.content}
        editable={local.editable}
        placeholder={local.placeholder}
        size="md"
        invalid={local.invalid}
        disabled={disabled()}
        visibility={local.visibility}
        onVisibilityChange={(v) => local.onVisibilityChange?.(v)}
        onChange={(html) => {
          setHtmlOut(html)
          local.onChange?.(html)
        }}
        onReady={(e) => {
          setEditorRef(e)
          local.onReady?.(e)
        }}
        onCreate={local.onCreate}
        onDestroy={local.onDestroy}
        onUpdate={local.onUpdate}
        onFocus={local.onFocus}
        onBlur={local.onBlur}
        rootAttrs={{ class: undefined, style: { display: "contents" } }}
        contentAttrs={{ class: undefined, style: { display: "contents" } }}
      >
        <div {...sx(styles.contentShell)}>
          <Toolbar
            editor={editorRef}
            groups={toolbarGroups().length > 0 ? toolbarGroups() : defaultToolbar}
            uploadImage={local.uploadImage}
            xstyle={toolbarC}
          />
          <TiptapEditorContent onReady={(e) => !editorRef() && setEditorRef(e)} xstyle={contentC} />
          <div {...actionsBarC}>
            <Show
              when={local.actions !== undefined && local.actions !== null}
              fallback={
                <TiptapEditorActions
                  showInsert={true}
                  showSave={local.showSaveButton !== false}
                  saveLabel={local.saveLabel ?? "保存"}
                  saveDisabled={local.saveDisabled}
                  saveLoading={local.saveLoading}
                  onSave={saveHtml}
                  insertItems={insertItemsFromPrimitives()}
                  attrs={{ class: undefined, style: { display: "contents" } }}
                />
              }
            >
              {local.actions}
            </Show>
          </div>
        </div>
      </TiptapEditorRoot>
    )
  }

  if (isFocusVariant()) return renderWithFocus()
  return renderCore()
}

export function TiptapEditor(props: TiptapEditorProps) {
  return <StyledTiptapEditor {...props} />
}

export function MinimalTiptapEditor(props: Omit<TiptapEditorProps, "variant">) {
  return <TiptapEditor {...props} variant="minimal" />
}
export function StandardTiptapEditor(props: Omit<TiptapEditorProps, "variant">) {
  return <TiptapEditor {...props} variant="standard" />
}
export function StandardMenuTiptapEditor(props: Omit<TiptapEditorProps, "variant">) {
  return <TiptapEditor {...props} variant="standard-with-menu" />
}
export function FocusTiptapEditor(props: Omit<TiptapEditorProps, "variant">) {
  return <TiptapEditor {...props} variant="focus" />
}
export function FullTiptapEditor(
  props: Omit<TiptapEditorProps, "variant" | "showActions" | "toolbarItems">,
) {
  return (
    <TiptapEditor {...props} variant="standard" showActions={false} toolbarItems={defaultToolbar} />
  )
}

export type {
  ToolbarGroupConfig,
  ToolbarCommand,
  ToolbarContext,
  ToolbarItemConfig,
} from "./tiptap-editor-toolbar"
export {
  Toolbar,
  defaultToolbar,
  compactToolbar,
  minimalToolbar,
  commandIsActive,
  commandCanExecute,
  executeCommand,
} from "./tiptap-editor-toolbar"

export {
  TiptapEditorRoot,
  ensureTiptapContentStyles,
  buildInsertMenuItems as buildTiptapInsertMenuItems,
}
export { TiptapEditorContent, TiptapEditorActions, TiptapEditorFocusShell, TiptapEditorFocusEntry }
export { useTiptapEditorContext }

export default TiptapEditor
export type { Editor as TiptapEditorInstance } from "@tiptap/core"
export type { HeadlessTiptapEditorProps } from "./tiptap-editor"
export type { TiptapEditorSize }
export type {
  TiptapEditorActionInsertItem,
  TiptapEditorInsertMenuItem,
  TiptapEditorInsertKind,
  TiptapEditorVariant,
}
export type { TiptapEditorVisibility }
