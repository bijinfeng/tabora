import * as stylex from "@stylexjs/stylex"
import { type JSX, Show, splitProps } from "solid-js"
import type { StyleXStyles } from "@stylexjs/stylex"

import { ImagePlus } from "lucide-solid/icons"
import { Button, IconButton } from "@tabora/ui/button"
import { DropdownMenu } from "@tabora/ui/dropdown-menu"
import type { DropdownMenuItem, DropdownMenuTriggerRenderProps } from "@tabora/ui/dropdown-menu"
import { space } from "@tabora/theme/tokens.stylex"

import { useTiptapEditorContext } from "./tiptap-editor-context"
import type { SolidAttrs } from "./tiptap-editor-root"
import { sx } from "./stylex"

const _ = stylex.create({
  wrap: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    gap: space.s3,
  },
  left: {
    alignItems: "center",
    display: "flex",
    gap: space.s3,
    minWidth: 0,
  },
  right: {
    alignItems: "center",
    display: "flex",
    gap: space.s3,
    minWidth: 0,
  },
})

export type TiptapEditorActionInsertItem = {
  id: string
  label: JSX.Element
  icon?: JSX.Element
  onClick?: () => void
}

export type TiptapEditorActionsProps = {
  showInsert?: boolean | undefined
  showSave?: boolean | undefined
  saveLabel?: JSX.Element | undefined
  saveDisabled?: boolean | undefined
  saveLoading?: boolean | undefined
  onInsertClick?: (() => void) | undefined
  onSave?: (() => void) | undefined
  insertItems?: TiptapEditorActionInsertItem[] | undefined
  insertTriggerClass?: string | undefined
  insertTriggerStyle?: JSX.CSSProperties | undefined
  leftExtra?: JSX.Element | undefined
  rightExtra?: JSX.Element | undefined
  xstyle?: StyleXStyles | ReturnType<typeof stylex.attrs> | undefined
  attrs?: SolidAttrs<HTMLElement> | undefined
  children?: JSX.Element | undefined
}

export function TiptapEditorActions(props: TiptapEditorActionsProps) {
  const ctx = useTiptapEditorContext()
  const [local] = splitProps(props, [
    "showInsert",
    "showSave",
    "saveLabel",
    "saveDisabled",
    "saveLoading",
    "onInsertClick",
    "onSave",
    "insertItems",
    "insertTriggerClass",
    "insertTriggerStyle",
    "leftExtra",
    "rightExtra",
    "xstyle",
    "attrs",
    "children",
  ])

  const wrap = (): SolidAttrs<HTMLElement> => {
    const c = sx(local.xstyle ?? _.wrap)
    return local.attrs ?? { class: c.class ?? undefined, style: c.style as any }
  }
  const w = wrap()
  const leftAttrs = sx(_.left)
  const rightAttrs = sx(_.right)

  const disabled = () => ctx.disabled()

  const insertMenuItems = (): DropdownMenuItem[] | undefined => {
    if (!local.insertItems || local.insertItems.length === 0) return undefined
    return local.insertItems.map((item) => ({
      id: item.id,
      label: item.label,
      icon: item.icon ?? <span />,
      onClick: () => item.onClick?.(),
    }))
  }

  return (
    <div
      data-tiptap-actions=""
      class={joinMaybe(w.class, "") || undefined}
      style={w.style as JSX.CSSProperties | undefined}
      ref={w.ref as any}
    >
      <div data-tiptap-actions-left="" {...leftAttrs}>
        <Show when={local.showInsert !== false}>
          <Show
            when={local.insertItems && local.insertItems.length > 0}
            fallback={
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="插入"
                title="插入"
                disabled={disabled()}
                onClick={() => local.onInsertClick?.()}
                style={local.insertTriggerStyle}
              >
                <ImagePlus height={16} width={16} />
              </IconButton>
            }
          >
            <DropdownMenu
              side="bottom"
              align="start"
              sideOffset={4}
              items={insertMenuItems()!}
              triggerAsChild={true}
              triggerDisabled={disabled()}
              triggerAriaLabel="插入"
              triggerTitle="插入"
            >
              {(t: DropdownMenuTriggerRenderProps) => {
                const { class: _c, style: _s, ...rest } = t as any
                return (
                  <IconButton
                    {...rest}
                    variant="ghost"
                    size="sm"
                    disabled={disabled() || !!t.disabled}
                    aria-label={t["aria-label"] ?? "插入"}
                    title={t.title ?? "插入"}
                    style={local.insertTriggerStyle}
                  >
                    <ImagePlus height={16} width={16} />
                  </IconButton>
                )
              }}
            </DropdownMenu>
          </Show>
        </Show>

        {local.leftExtra}
      </div>

      <div data-tiptap-actions-right="" {...rightAttrs}>
        {local.rightExtra}
        {local.children}
        <Show when={local.showSave !== false}>
          <Button
            variant="primary"
            size="sm"
            disabled={disabled() || !!local.saveDisabled}
            loading={!!local.saveLoading}
            onClick={() => {
              if (disabled()) return
              local.onSave?.()
            }}
          >
            {local.saveLabel ?? "保存"}
          </Button>
        </Show>
      </div>
    </div>
  )
}

function joinMaybe(a: string | undefined, _b: string): string | undefined {
  if (!a) return a
  return a
}

export default TiptapEditorActions
