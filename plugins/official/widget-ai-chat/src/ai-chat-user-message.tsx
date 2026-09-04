import * as stylex from "@stylexjs/stylex"
import { createSignal, For, Show } from "solid-js"
import type { UIMessage } from "@tanstack/ai-client"
import FileArchive from "lucide-solid/icons/file-archive"
import FileText from "lucide-solid/icons/file-text"
import File from "lucide-solid/icons/file"
import Image from "lucide-solid/icons/image"
import Paperclip from "lucide-solid/icons/paperclip"
import type { AiChatAttachment } from "./ai-chat-attachments"
import { attachmentMetadata, formatFileSize } from "./ai-chat-attachments"
import { styles } from "./styles"

function imageDataUrl(part: unknown): string | undefined {
  if (!part || typeof part !== "object") return undefined
  const record = part as Record<string, unknown>
  if (record.type !== "image" || !record.source || typeof record.source !== "object")
    return undefined
  const source = record.source as Record<string, unknown>
  if (
    source.type !== "data" ||
    typeof source.mimeType !== "string" ||
    !source.mimeType.startsWith("image/") ||
    typeof source.value !== "string"
  ) {
    return undefined
  }
  return `data:${source.mimeType};base64,${source.value}`
}

function textContent(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; content: string } => part.type === "text")
    .map((part) => part.content)
    .join("")
}

function AttachmentIcon(props: { kind: AiChatAttachment["kind"] }) {
  const iconProps = { size: 16, strokeWidth: 1.8 }
  if (props.kind === "archive") return <FileArchive {...iconProps} />
  if (props.kind === "image") return <Image {...iconProps} />
  if (props.kind === "text") return <FileText {...iconProps} />
  return <File {...iconProps} />
}

function AiChatAttachmentItem(props: {
  attachment: AiChatAttachment
  image?: string
  imageIndex: number
}) {
  const [expanded, setExpanded] = createSignal(false)
  const hasDetail = () => Boolean(props.image || props.attachment.preview)
  const id = () => `attachment-${props.imageIndex}-${props.attachment.name}`
  return (
    <div {...stylex.attrs(styles.userAttachment)}>
      <button
        type="button"
        {...stylex.attrs(styles.userAttachmentButton)}
        aria-expanded={hasDetail() ? expanded() : undefined}
        aria-controls={hasDetail() ? id() : undefined}
        disabled={!hasDetail()}
        onClick={() => hasDetail() && setExpanded((value) => !value)}
        title={hasDetail() ? `查看附件 ${props.attachment.name}` : props.attachment.detail}
      >
        <Show
          when={props.image}
          fallback={
            <span {...stylex.attrs(styles.userAttachmentIcon)}>
              <AttachmentIcon kind={props.attachment.kind} />
            </span>
          }
        >
          {(source) => (
            <img
              {...stylex.attrs(styles.userAttachmentThumbnail)}
              src={source()}
              alt={`附件预览：${props.attachment.name}`}
            />
          )}
        </Show>
        <span {...stylex.attrs(styles.userAttachmentInfo)}>
          <span {...stylex.attrs(styles.userAttachmentName)}>{props.attachment.name}</span>
          <span {...stylex.attrs(styles.userAttachmentMeta)}>
            {formatFileSize(props.attachment.size)} · {props.attachment.detail}
          </span>
        </span>
        <Show when={hasDetail()}>
          <Paperclip {...stylex.attrs(styles.userAttachmentAffordance)} size={14} />
        </Show>
      </button>
      <Show when={expanded() && hasDetail()}>
        <div id={id()} {...stylex.attrs(styles.userAttachmentDetail)}>
          <Show when={props.image}>
            {(source) => (
              <img
                {...stylex.attrs(styles.userAttachmentImage)}
                src={source()}
                alt={`附件：${props.attachment.name}`}
              />
            )}
          </Show>
          <Show when={props.attachment.preview}>
            <pre {...stylex.attrs(styles.userAttachmentPreview)}>{props.attachment.preview}</pre>
          </Show>
        </div>
      </Show>
    </div>
  )
}

/** Render user-authored text and separate, persisted attachment controls. */
export function AiChatUserMessage(props: { message: UIMessage }) {
  const metadata = () => attachmentMetadata(props.message)
  const images = () => props.message.parts.map(imageDataUrl).filter(Boolean) as string[]
  const displayText = () => metadata()?.displayText ?? textContent(props.message)
  return (
    <div {...stylex.attrs(styles.userMessageContent)}>
      <Show when={metadata()?.attachments.length}>
        <div {...stylex.attrs(styles.userAttachmentList)} aria-label="消息附件">
          <For each={metadata()?.attachments}>
            {(attachment, index) => {
              const currentImageIndex = () =>
                attachment.kind === "image"
                  ? (metadata()
                      ?.attachments.slice(0, index())
                      .filter((item) => item.kind === "image").length ?? 0)
                  : -1
              return (
                <AiChatAttachmentItem
                  attachment={attachment}
                  imageIndex={index()}
                  {...(currentImageIndex() >= 0 && images()[currentImageIndex()]
                    ? { image: images()[currentImageIndex()] }
                    : {})}
                />
              )
            }}
          </For>
        </div>
      </Show>
      <Show when={displayText()}>
        <span {...stylex.attrs(styles.userMessageText)}>{displayText()}</span>
      </Show>
      <Show when={!metadata()}>
        <For each={images()}>
          {(source) => (
            <img {...stylex.attrs(styles.userMessageImage)} src={source} alt="已附图片" />
          )}
        </For>
      </Show>
    </div>
  )
}
