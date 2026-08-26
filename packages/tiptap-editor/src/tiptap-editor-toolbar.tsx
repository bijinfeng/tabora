import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"
import { type Accessor, createEffect, createSignal, For, type JSX, Show } from "solid-js"

import { color } from "@tabora/theme/tokens.stylex"
import { Button, IconButton } from "@tabora/ui/button"
import { DropdownMenu } from "@tabora/ui/dropdown-menu"
import type { DropdownMenuItem, DropdownMenuTriggerRenderProps } from "@tabora/ui/dropdown-menu"
import { Input } from "@tabora/ui/input"
import { Popover } from "@tabora/ui/popover"
import type { PopoverTriggerRenderProps } from "@tabora/ui/popover"
import { space } from "@tabora/theme/tokens.stylex"

import type { Editor } from "@tiptap/core"

import { sx } from "./stylex"

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  ChevronDown,
  Unlink,
} from "lucide-solid/icons"

const styles = stylex.create({
  toolbar: {
    alignItems: "center",
    borderBottomColor: "transparent",
    borderBottomStyle: "solid",
    borderBottomWidth: 0,
    display: "flex",
    flexWrap: "wrap",
    gap: space.s2,
    paddingBlock: space.s3,
    paddingInline: space.s4,
    backgroundColor: "transparent",
  },
  toolbarGroup: {
    alignItems: "center",
    display: "flex",
    gap: space.s1,
  },
  toolbarEnd: {
    alignItems: "center",
    display: "flex",
    marginInlineStart: "auto",
  },
  toolbarDivider: {
    alignSelf: "stretch",
    backgroundColor: color.line,
    borderStyle: "none",
    borderWidth: 0,
    height: "auto",
    marginBlock: space.s2,
    marginInline: space.s2,
    width: 1,
  },
  toolbarButtonActive: {
    backgroundColor: color.accentSoft,
    borderColor: "transparent",
    color: color.accent,
    ":hover": {
      backgroundColor:
        "color-mix(in srgb, rgb(var(--tbr-color-accent-soft)) 78%, rgb(var(--tbr-color-surface-hover)))",
      color: color.accent,
    },
  },
  linkPopover: {
    display: "flex",
    flexDirection: "column",
    gap: space.s3,
    minWidth: 260,
  },
  linkPopoverActions: {
    display: "flex",
    gap: space.s2,
    justifyContent: "flex-end",
  },
  headingDropdownIcon: {
    height: 16,
    width: 16,
  },
  dangerText: {
    color: color.danger,
  },
})

export type ToolbarGroupConfig = {
  items: ToolbarItemConfig[]
}

export type ToolbarItemConfig =
  | { type: "divider" }
  | { type: "command"; command: ToolbarCommand }
  | { type: "custom"; render: (ctx: ToolbarContext) => JSX.Element }

export type ToolbarCommand =
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "code"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "paragraph"
  | "bullet-list"
  | "ordered-list"
  | "task-list"
  | "blockquote"
  | "code-block"
  | "horizontal-rule"
  | "align-left"
  | "align-center"
  | "align-right"
  | "align-justify"
  | "link"
  | "image"
  | "undo"
  | "redo"
  | "headings-dropdown"
  | "lists-dropdown"
  | "align-dropdown"

export type ToolbarContext = {
  editor: Accessor<Editor | null>
}

export const defaultToolbar: ToolbarGroupConfig[] = [
  {
    items: [
      { type: "command", command: "undo" },
      { type: "command", command: "redo" },
    ],
  },
  {
    items: [{ type: "command", command: "headings-dropdown" }],
  },
  {
    items: [
      { type: "command", command: "bold" },
      { type: "command", command: "italic" },
      { type: "command", command: "underline" },
      { type: "command", command: "strike" },
      { type: "command", command: "code" },
    ],
  },
  {
    items: [{ type: "command", command: "lists-dropdown" }],
  },
  {
    items: [
      { type: "command", command: "blockquote" },
      { type: "command", command: "code-block" },
      { type: "command", command: "horizontal-rule" },
    ],
  },
  {
    items: [{ type: "command", command: "align-dropdown" }],
  },
  {
    items: [
      { type: "command", command: "link" },
      { type: "command", command: "image" },
    ],
  },
]

export const compactToolbar: ToolbarGroupConfig[] = [
  {
    items: [{ type: "command", command: "headings-dropdown" }],
  },
  {
    items: [
      { type: "command", command: "bold" },
      { type: "command", command: "italic" },
      { type: "command", command: "strike" },
    ],
  },
  {
    items: [{ type: "command", command: "lists-dropdown" }],
  },
  {
    items: [{ type: "command", command: "align-dropdown" }],
  },
  {
    items: [{ type: "command", command: "code-block" }],
  },
]

export const minimalToolbar: ToolbarGroupConfig[] = []

function commandIcon(cmd: ToolbarCommand): JSX.Element {
  const common = { height: 16, width: 16 } as const
  switch (cmd) {
    case "bold":
      return <Bold {...common} />
    case "italic":
      return <Italic {...common} />
    case "underline":
      return <UnderlineIcon {...common} />
    case "strike":
      return <Strikethrough {...common} />
    case "code":
      return <Code {...common} />
    case "heading-1":
    case "headings-dropdown":
      return <Heading1 {...common} />
    case "heading-2":
      return <Heading2 {...common} />
    case "heading-3":
      return <Heading3 {...common} />
    case "bullet-list":
    case "lists-dropdown":
      return <List {...common} />
    case "ordered-list":
      return <ListOrdered {...common} />
    case "task-list":
      return <ListTodo {...common} />
    case "blockquote":
      return <Quote {...common} />
    case "code-block":
      return <Code2 {...common} />
    case "horizontal-rule":
      return <Minus {...common} />
    case "align-left":
    case "align-dropdown":
      return <AlignLeft {...common} />
    case "align-center":
      return <AlignCenter {...common} />
    case "align-right":
      return <AlignRight {...common} />
    case "align-justify":
      return <AlignJustify {...common} />
    case "link":
      return <LinkIcon {...common} />
    case "image":
      return <ImageIcon {...common} />
    case "undo":
      return <Undo {...common} />
    case "redo":
      return <Redo {...common} />
    default:
      return <Code {...common} />
  }
}

function commandLabel(cmd: ToolbarCommand): string {
  const map: Record<ToolbarCommand, string> = {
    bold: "加粗",
    italic: "斜体",
    underline: "下划线",
    strike: "删除线",
    code: "行内代码",
    "heading-1": "标题 1",
    "heading-2": "标题 2",
    "heading-3": "标题 3",
    paragraph: "正文",
    "bullet-list": "无序列表",
    "ordered-list": "有序列表",
    "task-list": "待办列表",
    blockquote: "引用",
    "code-block": "代码块",
    "horizontal-rule": "分割线",
    "align-left": "左对齐",
    "align-center": "居中",
    "align-right": "右对齐",
    "align-justify": "两端对齐",
    link: "链接",
    image: "图片",
    undo: "撤销",
    redo: "重做",
    "headings-dropdown": "标题",
    "lists-dropdown": "列表",
    "align-dropdown": "对齐",
  }
  return map[cmd] ?? cmd
}

export function commandIsActive(editor: Editor | null, cmd: ToolbarCommand): boolean {
  if (!editor) return false
  switch (cmd) {
    case "bold":
      return editor.isActive("bold")
    case "italic":
      return editor.isActive("italic")
    case "underline":
      return editor.isActive("underline")
    case "strike":
      return editor.isActive("strike")
    case "code":
      return editor.isActive("code")
    case "heading-1":
      return editor.isActive("heading", { level: 1 })
    case "heading-2":
      return editor.isActive("heading", { level: 2 })
    case "heading-3":
      return editor.isActive("heading", { level: 3 })
    case "paragraph":
      return editor.isActive("paragraph")
    case "bullet-list":
      return editor.isActive("bulletList")
    case "ordered-list":
      return editor.isActive("orderedList")
    case "task-list":
      return editor.isActive("taskList")
    case "blockquote":
      return editor.isActive("blockquote")
    case "code-block":
      return editor.isActive("codeBlock")
    case "align-left":
      return editor.isActive({ textAlign: "left" })
    case "align-center":
      return editor.isActive({ textAlign: "center" })
    case "align-right":
      return editor.isActive({ textAlign: "right" })
    case "align-justify":
      return editor.isActive({ textAlign: "justify" })
    case "link":
      return editor.isActive("link")
    default:
      return false
  }
}

export function commandCanExecute(editor: Editor | null, cmd: ToolbarCommand): boolean {
  if (!editor) return false
  try {
    const can = editor.can()
    switch (cmd) {
      case "bold":
        return can.toggleBold()
      case "italic":
        return can.toggleItalic()
      case "underline":
        return can.toggleUnderline()
      case "strike":
        return can.toggleStrike()
      case "code":
        return can.toggleCode()
      case "heading-1":
        return can.toggleHeading({ level: 1 })
      case "heading-2":
        return can.toggleHeading({ level: 2 })
      case "heading-3":
        return can.toggleHeading({ level: 3 })
      case "paragraph":
        return can.setParagraph()
      case "bullet-list":
        return can.toggleBulletList()
      case "ordered-list":
        return can.toggleOrderedList()
      case "task-list":
        return can.toggleTaskList()
      case "blockquote":
        return can.toggleBlockquote()
      case "code-block":
        return can.toggleCodeBlock()
      case "horizontal-rule":
        return can.setHorizontalRule()
      case "align-left":
        return can.setTextAlign("left")
      case "align-center":
        return can.setTextAlign("center")
      case "align-right":
        return can.setTextAlign("right")
      case "align-justify":
        return can.setTextAlign("justify")
      case "undo":
        return can.undo()
      case "redo":
        return can.redo()
      case "link":
      case "image":
        return true
      default:
        return true
    }
  } catch {
    return true
  }
}

export function executeCommand(editor: Editor | null, cmd: ToolbarCommand): void {
  if (!editor) return
  const chain = editor.chain().focus()
  switch (cmd) {
    case "bold":
      chain.toggleBold().run()
      return
    case "italic":
      chain.toggleItalic().run()
      return
    case "underline":
      chain.toggleUnderline().run()
      return
    case "strike":
      chain.toggleStrike().run()
      return
    case "code":
      chain.toggleCode().run()
      return
    case "heading-1":
      chain.toggleHeading({ level: 1 }).run()
      return
    case "heading-2":
      chain.toggleHeading({ level: 2 }).run()
      return
    case "heading-3":
      chain.toggleHeading({ level: 3 }).run()
      return
    case "paragraph":
      chain.setParagraph().run()
      return
    case "bullet-list":
      chain.toggleBulletList().run()
      return
    case "ordered-list":
      chain.toggleOrderedList().run()
      return
    case "task-list":
      chain.toggleTaskList().run()
      return
    case "blockquote":
      chain.toggleBlockquote().run()
      return
    case "code-block":
      chain.toggleCodeBlock().run()
      return
    case "horizontal-rule":
      chain.setHorizontalRule().run()
      return
    case "align-left":
      chain.setTextAlign("left").run()
      return
    case "align-center":
      chain.setTextAlign("center").run()
      return
    case "align-right":
      chain.setTextAlign("right").run()
      return
    case "align-justify":
      chain.setTextAlign("justify").run()
      return
    case "undo":
      chain.undo().run()
      return
    case "redo":
      chain.redo().run()
      return
  }
}

function ToolbarButton(props: {
  editor: Accessor<Editor | null>
  command: ToolbarCommand
  onClick?: (() => void) | undefined
  ariaLabel?: string | undefined
  extraClass?: StyleXStyles | undefined
}) {
  const active = () => commandIsActive(props.editor(), props.command)
  const disabled = () => !commandCanExecute(props.editor(), props.command)

  return (
    <IconButton
      variant="ghost"
      size="sm"
      aria-label={props.ariaLabel ?? commandLabel(props.command)}
      title={commandLabel(props.command)}
      disabled={disabled()}
      onClick={() => {
        if (props.onClick) {
          props.onClick()
        } else {
          executeCommand(props.editor(), props.command)
        }
      }}
      xstyle={[active() ? styles.toolbarButtonActive : undefined, props.extraClass]}
    >
      {commandIcon(props.command)}
    </IconButton>
  )
}

function HeadingsDropdown(props: { editor: Accessor<Editor | null> }) {
  const items = (): DropdownMenuItem[] => {
    const list: DropdownMenuItem[] = [
      {
        id: "paragraph",
        label: "正文",
        icon: <span />,
        checked: props.editor()?.isActive("paragraph") ?? false,
        onClick: () => executeCommand(props.editor(), "paragraph"),
      },
      { id: "sep-1", label: <></>, separator: true },
    ]
    for (let level = 1; level <= 3; level++) {
      list.push({
        id: `h-${level}`,
        label: `标题 ${level}`,
        icon: <span />,
        checked: props.editor()?.isActive("heading", { level }) ?? false,
        onClick: () => executeCommand(props.editor(), `heading-${level}` as ToolbarCommand),
      })
    }
    return list
  }

  const active = props.editor()?.isActive("heading") ?? false
  const disabled = props.editor()?.isEditable === false

  return (
    <DropdownMenu
      items={items()}
      side="bottom"
      align="start"
      sideOffset={4}
      triggerAsChild={true}
      triggerDisabled={disabled}
      triggerAriaLabel="标题"
      triggerTitle="标题"
    >
      {(t: DropdownMenuTriggerRenderProps) => {
        const { class: _c, style: _s, ...rest } = t as any
        return (
          <Button
            {...rest}
            variant={active ? "subtle" : "ghost"}
            size="sm"
            disabled={disabled || !!t.disabled}
            aria-label={t["aria-label"] ?? "标题"}
            title={t.title ?? "标题"}
          >
            <Heading1 {...sx(styles.headingDropdownIcon)} />
            <ChevronDown height={14} width={14} />
          </Button>
        )
      }}
    </DropdownMenu>
  )
}

function ListsDropdown(props: { editor: Accessor<Editor | null> }) {
  const items = (): DropdownMenuItem[] => [
    {
      id: "bullet",
      label: "无序列表",
      icon: <span />,
      checked: props.editor()?.isActive("bulletList") ?? false,
      onClick: () => executeCommand(props.editor(), "bullet-list"),
    },
    {
      id: "ordered",
      label: "有序列表",
      icon: <span />,
      checked: props.editor()?.isActive("orderedList") ?? false,
      onClick: () => executeCommand(props.editor(), "ordered-list"),
    },
    {
      id: "task",
      label: "待办列表",
      icon: <span />,
      checked: props.editor()?.isActive("taskList") ?? false,
      onClick: () => executeCommand(props.editor(), "task-list"),
    },
  ]

  const active =
    (props.editor()?.isActive("bulletList") ?? false) ||
    (props.editor()?.isActive("orderedList") ?? false) ||
    (props.editor()?.isActive("taskList") ?? false)
  const disabled = props.editor()?.isEditable === false

  return (
    <DropdownMenu
      items={items()}
      side="bottom"
      align="start"
      sideOffset={4}
      triggerAsChild={true}
      triggerDisabled={disabled}
      triggerAriaLabel="列表"
      triggerTitle="列表"
    >
      {(t: DropdownMenuTriggerRenderProps) => {
        const { class: _c, style: _s, ...rest } = t as any
        return (
          <Button
            {...rest}
            variant={active ? "subtle" : "ghost"}
            size="sm"
            disabled={disabled || !!t.disabled}
            aria-label={t["aria-label"] ?? "列表"}
            title={t.title ?? "列表"}
          >
            <List {...sx(styles.headingDropdownIcon)} />
            <ChevronDown height={14} width={14} />
          </Button>
        )
      }}
    </DropdownMenu>
  )
}

function AlignDropdown(props: { editor: Accessor<Editor | null> }) {
  const items = (): DropdownMenuItem[] => [
    {
      id: "left",
      label: "左对齐",
      icon: <span />,
      checked: props.editor()?.isActive({ textAlign: "left" }) ?? false,
      onClick: () => executeCommand(props.editor(), "align-left"),
    },
    {
      id: "center",
      label: "居中",
      icon: <span />,
      checked: props.editor()?.isActive({ textAlign: "center" }) ?? false,
      onClick: () => executeCommand(props.editor(), "align-center"),
    },
    {
      id: "right",
      label: "右对齐",
      icon: <span />,
      checked: props.editor()?.isActive({ textAlign: "right" }) ?? false,
      onClick: () => executeCommand(props.editor(), "align-right"),
    },
    {
      id: "justify",
      label: "两端对齐",
      icon: <span />,
      checked: props.editor()?.isActive({ textAlign: "justify" }) ?? false,
      onClick: () => executeCommand(props.editor(), "align-justify"),
    },
  ]

  const active =
    (props.editor()?.isActive({ textAlign: "center" }) ?? false) ||
    (props.editor()?.isActive({ textAlign: "right" }) ?? false) ||
    (props.editor()?.isActive({ textAlign: "justify" }) ?? false)
  const disabled = props.editor()?.isEditable === false

  return (
    <DropdownMenu
      items={items()}
      side="bottom"
      align="start"
      sideOffset={4}
      triggerAsChild={true}
      triggerDisabled={disabled}
      triggerAriaLabel="对齐"
      triggerTitle="对齐"
    >
      {(t: DropdownMenuTriggerRenderProps) => {
        const { class: _c, style: _s, ...rest } = t as any
        const currentAlign = () => {
          const ed = props.editor()
          if (ed?.isActive({ textAlign: "center" }))
            return <AlignCenter {...sx(styles.headingDropdownIcon)} />
          if (ed?.isActive({ textAlign: "right" }))
            return <AlignRight {...sx(styles.headingDropdownIcon)} />
          if (ed?.isActive({ textAlign: "justify" }))
            return <AlignJustify {...sx(styles.headingDropdownIcon)} />
          return <AlignLeft {...sx(styles.headingDropdownIcon)} />
        }
        return (
          <Button
            {...rest}
            variant={active ? "subtle" : "ghost"}
            size="sm"
            disabled={disabled || !!t.disabled}
            aria-label={t["aria-label"] ?? "对齐"}
            title={t.title ?? "对齐"}
          >
            {currentAlign()}
            <ChevronDown height={14} width={14} />
          </Button>
        )
      }}
    </DropdownMenu>
  )
}

function LinkPopover(props: {
  editor: Accessor<Editor | null>
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [url, setUrl] = createSignal("")
  const [text, setText] = createSignal("")

  createEffect(() => {
    if (props.open) {
      const ed = props.editor()
      if (ed?.isActive("link")) {
        const attrs = ed.getAttributes("link")
        setUrl((attrs?.href as string) ?? "")
        setText(ed.state.doc.textBetween(ed.state.selection.from, ed.state.selection.to) ?? "")
      } else {
        setText(ed?.state.doc.textBetween(ed.state.selection.from, ed.state.selection.to) ?? "")
        setUrl("")
      }
    }
  })

  const apply = () => {
    const ed = props.editor()
    if (!ed) return
    const target = url().trim()
    if (!target) {
      ed.chain().focus().extendMarkRange("link").unsetLink().run()
    } else {
      const range = { from: ed.state.selection.from, to: ed.state.selection.to }
      if (text().trim() && text() !== ed.state.doc.textBetween(range.from, range.to)) {
        ed.chain().focus().insertContentAt(range, text().trim()).run()
      }
      ed.chain().focus().extendMarkRange("link").setLink({ href: target }).run()
    }
    props.onOpenChange(false)
  }

  const unlink = () => {
    const ed = props.editor()
    if (!ed) return
    ed.chain().focus().extendMarkRange("link").unsetLink().run()
    props.onOpenChange(false)
  }

  const active = () => commandIsActive(props.editor(), "link")
  const disabled = () =>
    !commandCanExecute(props.editor(), "link") || props.editor()?.isEditable === false

  return (
    <Popover
      open={props.open}
      onOpenChange={props.onOpenChange}
      title="插入链接"
      triggerAsChild={true}
      triggerDisabled={disabled()}
      triggerAriaLabel="链接"
      triggerTitle="链接"
      trigger={(t: PopoverTriggerRenderProps) => {
        const { class: _c, style: _s, ...rest } = t as any
        return (
          <IconButton
            {...rest}
            variant={active() ? "subtle" : "ghost"}
            size="sm"
            disabled={disabled() || !!t.disabled}
            aria-label={t["aria-label"] ?? "链接"}
            title={t.title ?? "链接"}
            xstyle={[active() ? styles.toolbarButtonActive : undefined]}
          >
            <LinkIcon height={16} width={16} />
          </IconButton>
        )
      }}
    >
      <div {...sx(styles.linkPopover)}>
        <Input
          size="sm"
          placeholder="显示文本"
          value={text()}
          onInput={(value) => setText(value as string)}
        />
        <Input
          size="sm"
          placeholder="https://example.com"
          value={url()}
          onInput={(value) => setUrl(value as string)}
        />
        <div {...sx(styles.linkPopoverActions)}>
          <Show when={props.editor()?.isActive("link")}>
            <Button size="sm" variant="ghost" onClick={unlink} xstyle={styles.dangerText}>
              <Unlink height={14} width={14} />
              移除
            </Button>
          </Show>
          <Button size="sm" variant="secondary" onClick={() => props.onOpenChange(false)}>
            取消
          </Button>
          <Button size="sm" variant="primary" onClick={apply}>
            应用
          </Button>
        </div>
      </div>
    </Popover>
  )
}

function ImageButton(props: {
  editor: Accessor<Editor | null>
  upload?: ((file: File) => Promise<string>) | undefined
}) {
  const disabled = () => props.editor()?.isEditable === false

  const pickFile = async () => {
    const ed = props.editor()
    if (!ed) return
    if (props.upload) {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return
        try {
          const url = await props.upload!(file)
          ed.chain().focus().setImage({ src: url }).run()
        } catch (err) {
          console.error("Image upload failed", err)
        }
      }
      input.click()
    } else {
      const url = window.prompt("请输入图片 URL:")
      if (url?.trim()) {
        ed.chain().focus().setImage({ src: url.trim() }).run()
      }
    }
  }

  return (
    <IconButton
      variant="ghost"
      size="sm"
      aria-label="图片"
      title="图片"
      disabled={disabled()}
      onClick={pickFile}
    >
      <ImageIcon height={16} width={16} />
    </IconButton>
  )
}

export function Toolbar(props: {
  editor: Accessor<Editor | null>
  groups: ToolbarGroupConfig[]
  uploadImage?: ((file: File) => Promise<string>) | undefined
  xstyle?: StyleXStyles | ReturnType<typeof stylex.attrs> | undefined
  end?: JSX.Element | undefined
}) {
  const [linkOpen, setLinkOpen] = createSignal(false)

  return (
    <div {...sx(styles.toolbar, props.xstyle)}>
      <For each={props.groups}>
        {(group, gi) => (
          <div {...sx(styles.toolbarGroup)} data-group-index={gi()}>
            <For each={group.items}>
              {(item) => {
                if (item.type === "divider") {
                  return <hr {...sx(styles.toolbarDivider)} />
                }
                if (item.type === "custom") {
                  return <div>{item.render({ editor: props.editor })}</div>
                }
                switch (item.command) {
                  case "headings-dropdown":
                    return <HeadingsDropdown editor={props.editor} />
                  case "lists-dropdown":
                    return <ListsDropdown editor={props.editor} />
                  case "align-dropdown":
                    return <AlignDropdown editor={props.editor} />
                  case "link":
                    return (
                      <LinkPopover
                        editor={props.editor}
                        open={linkOpen()}
                        onOpenChange={setLinkOpen}
                      />
                    )
                  case "image":
                    return <ImageButton editor={props.editor} upload={props.uploadImage} />
                  default:
                    return <ToolbarButton editor={props.editor} command={item.command} />
                }
              }}
            </For>
          </div>
        )}
      </For>
      <Show when={props.end}>
        <div {...sx(styles.toolbarEnd)}>{props.end}</div>
      </Show>
    </div>
  )
}

export { styles as toolbarStyles }
