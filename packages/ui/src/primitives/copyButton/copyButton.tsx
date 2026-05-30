import type { JSX } from "solid-js"
import { createSignal } from "solid-js"

export type CopyButtonProps = {
  value: string
  class?: string
  children?: JSX.Element
}

export function CopyButton(props: CopyButtonProps) {
  const [copied, setCopied] = createSignal(false)
  return (
    <button
      class={props.class}
      onClick={async () => {
        await navigator.clipboard.writeText(props.value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      data-copied={copied() ? "" : undefined}
    >
      {props.children || (copied() ? "✓ 已复制" : "📋 复制")}
    </button>
  )
}
