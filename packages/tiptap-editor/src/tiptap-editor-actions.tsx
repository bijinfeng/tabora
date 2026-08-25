import * as stylex from "@stylexjs/stylex"
import { createMemo, type JSX, Show, splitProps } from "solid-js"
import type { StyleXStyles } from "@stylexjs/stylex"

import { ChevronDown, ImagePlus, Lock, Unlock, Users } from "lucide-solid/icons"
import { Button, IconButton } from "@tabora/ui/button"
import { DropdownMenu } from "@tabora/ui/dropdown-menu"
import type { DropdownMenuItem, DropdownMenuTriggerRenderProps } from "@tabora/ui/dropdown-menu"
import { space } from "@tabora/theme/tokens.stylex"

import { useTiptapEditorContext, type TiptapEditorVisibility } from "./tiptap-editor-context"
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
  showVisibility?: boolean | undefined
  showSave?: boolean | undefined
  saveLabel?: JSX.Element | undefined
  saveDisabled?: boolean | undefined
  saveLoading?: boolean | undefined
  onInsertClick?: (() => void) | undefined
  onSave?: (() => void) | undefined
  visibilityOptions?:
    | {
        id: TiptapEditorVisibility
        label: JSX.Element
        icon?: JSX.Element
      }[]
    | undefined
  insertItems?: TiptapEditorActionInsertItem[] | undefined
  insertTriggerClass?: string | undefined
  insertTriggerStyle?: JSX.CSSProperties | undefined
  leftExtra?: JSX.Element | undefined
  rightExtra?: JSX.Element | undefined
  xstyle?: StyleXStyles | ReturnType<typeof stylex.attrs> | undefined
  attrs?: SolidAttrs<HTMLElement> | undefined
  children?: JSX.Element | undefined
}

function defaultVisOptions(): NonNullable<TiptapEditorActionsProps["visibilityOptions"]> {
  return [
    {
      id: "private",
      label: "私有",
      icon: <Lock height={16} width={16} />,
    },
    {
      id: "friends",
      label: "仅好友",
      icon: <Users height={16} width={16} />,
    },
    {
      id: "public",
      label: "公开",
      icon: <Unlock height={16} width={16} />,
    },
  ]
}

function visibilityLabel(
  v: TiptapEditorVisibility,
  opts: NonNullable<TiptapEditorActionsProps["visibilityOptions"]>,
): NonNullable<NonNullable<TiptapEditorActionsProps["visibilityOptions"]>[number]> {
  return (opts.find((o) => o.id === v) ?? opts[0]) as NonNullable<
    NonNullable<TiptapEditorActionsProps["visibilityOptions"]>[number]
  >
}

export function TiptapEditorActions(props: TiptapEditorActionsProps) {
  const ctx = useTiptapEditorContext()
  const [local] = splitProps(props, [
    "showInsert",
    "showVisibility",
    "showSave",
    "saveLabel",
    "saveDisabled",
    "saveLoading",
    "onInsertClick",
    "onSave",
    "visibilityOptions",
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

  const opts = createMemo(() => local.visibilityOptions ?? defaultVisOptions())
  const vis = () => visibilityLabel(ctx.visibility(), opts())

  const disabled = () => ctx.disabled()

  const visItems = (): DropdownMenuItem[] =>
    opts().map((o) => ({
      id: o.id,
      label: o.label,
      icon: o.icon ?? <span />,
      checked: ctx.visibility() === o.id,
      onClick: () => ctx.setVisibility(o.id),
    }))

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
                size="md"
                aria-label="插入"
                title="插入"
                disabled={disabled()}
                onClick={() => local.onInsertClick?.()}
                style={local.insertTriggerStyle}
              >
                <ImagePlus height={18} width={18} />
              </IconButton>
            }
          >
            <DropdownMenu
              side="bottom"
              align="start"
              sideOffset={4}
              items={insertMenuItems()!}
              triggerDisabled={disabled()}
              triggerAriaLabel="插入"
              triggerTitle="插入"
              triggerClass={local.insertTriggerClass}
              triggerStyle={local.insertTriggerStyle}
            >
              <ImagePlus height={18} width={18} />
            </DropdownMenu>
          </Show>
        </Show>

        <Show when={local.showVisibility !== false}>
          <DropdownMenu
            side="bottom"
            align="start"
            sideOffset={4}
            items={visItems()}
            triggerAsChild={true}
            triggerDisabled={disabled()}
            triggerAriaLabel="可见性"
            triggerTitle="可见性"
          >
            {(t: DropdownMenuTriggerRenderProps) => {
              const { class: _c, style: _s, ...rest } = t as any
              return (
                <Button
                  {...rest}
                  variant="subtle"
                  size="sm"
                  disabled={disabled() || !!t.disabled}
                  aria-label={t["aria-label"] ?? "可见性"}
                  title={t.title ?? "可见性"}
                >
                  {vis().icon ?? <Lock height={14} width={14} />}
                  <span data-tiptap-visibility-label="">{vis().label}</span>
                  <ChevronDown height={12} width={12} />
                </Button>
              )
            }}
          </DropdownMenu>
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
