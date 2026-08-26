import type { JSX } from "solid-js"

import {
  Expand,
  ImagePlus,
  Link as LinkIcon,
  MapPin,
  Mic,
  Paperclip,
  PanelTop,
} from "lucide-solid/icons"
import { useTiptapEditorContext } from "../tiptap-editor-context"
import type { TiptapEditorInsertKind } from "../tiptap-editor-root"
export { TiptapEditorInsertDialog } from "./insert-dialogs"
export type { TiptapEditorInsertDialogProps } from "./insert-dialogs"

export type TiptapEditorInsertMenuItem =
  | {
      id: string
      kind: "item"
      label: JSX.Element
      icon?: JSX.Element
      checked?: boolean
      onClick?: () => void
      onKind?: TiptapEditorInsertKind
    }
  | { id: string; kind: "separator" }

export const defaultInsertMenuItems: TiptapEditorInsertMenuItem[] = [
  {
    id: "media",
    kind: "item",
    label: "媒体",
    icon: <ImagePlus height={16} width={16} />,
    onKind: "media",
  },
  {
    id: "audio",
    kind: "item",
    label: "录制音频",
    icon: <Mic height={16} width={16} />,
    onKind: "audio",
  },
  {
    id: "file",
    kind: "item",
    label: "文件",
    icon: <Paperclip height={16} width={16} />,
    onKind: "file",
  },
  {
    id: "link",
    kind: "item",
    label: "链接备忘录",
    icon: <LinkIcon height={16} width={16} />,
    onKind: "link",
  },
  {
    id: "location",
    kind: "item",
    label: "添加位置",
    icon: <MapPin height={16} width={16} />,
    onKind: "location",
  },
  { id: "sep-mode", kind: "separator" },
  {
    id: "focus-mode",
    kind: "item",
    label: "聚焦模式",
    icon: <Expand height={16} width={16} />,
    onKind: "toggle-focus",
  },
  {
    id: "format-toolbar",
    kind: "item",
    label: "格式工具栏",
    icon: <PanelTop height={16} width={16} />,
    onKind: "toggle-format-toolbar",
  },
]

export type TiptapEditorInsertMenuOptions = {
  items?: TiptapEditorInsertMenuItem[] | undefined
  onKind?: (kind: TiptapEditorInsertKind) => void
  onItemClick?: (item: Extract<TiptapEditorInsertMenuItem, { kind: "item" }>) => void
}

export function buildInsertMenuItems(ctxOptions: TiptapEditorInsertMenuOptions = {}): {
  items: any[]
  handleClick: (item: Extract<TiptapEditorInsertMenuItem, { kind: "item" }>) => void
} {
  const ctx = useTiptapEditorContext()
  const rawItems = ctxOptions.items ?? defaultInsertMenuItems

  const handleClick = (item: Extract<TiptapEditorInsertMenuItem, { kind: "item" }>) => {
    ctxOptions.onItemClick?.(item)
    const kind = item.onKind
    if (!kind) {
      item.onClick?.()
      return
    }
    switch (kind) {
      case "toggle-focus":
        ctx.setFocusMode(!ctx.focusMode())
        break
      case "toggle-format-toolbar":
        ctx.setFormatToolbarVisible(!ctx.formatToolbarVisible())
        break
      default:
        break
    }
    ctxOptions.onKind?.(kind)
    if (item.onClick) item.onClick()
  }

  const items: any[] = rawItems.map((raw) => {
    if (raw.kind === "separator") {
      return { id: raw.id, label: <></>, separator: true as const }
    }
    const checked =
      raw.checked ??
      (raw.onKind === "toggle-focus"
        ? ctx.focusMode()
        : raw.onKind === "toggle-format-toolbar"
          ? ctx.formatToolbarVisible()
          : false)
    return {
      id: raw.id,
      label: raw.label,
      icon: raw.icon ?? <span />,
      checked,
      onClick: () => handleClick(raw),
    }
  })

  return { items, handleClick }
}
