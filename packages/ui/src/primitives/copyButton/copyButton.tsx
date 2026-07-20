import type { JSX } from "solid-js"
import { createSignal } from "solid-js"
import { Check, Copy } from "lucide-solid"

export type CopyButtonProps = {
  value: string
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  copiedClass?: string | undefined
  copiedStyle?: JSX.CSSProperties | undefined
  children?: JSX.Element
}

export function CopyButton(props: CopyButtonProps) {
  const [copied, setCopied] = createSignal(false)
  return (
    <button
      class={[props.class, copied() ? props.copiedClass : undefined].filter(Boolean).join(" ")}
      style={copied() ? { ...props.style, ...props.copiedStyle } : props.style}
      onClick={async () => {
        await navigator.clipboard.writeText(props.value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      data-copied={copied() ? "" : undefined}
    >
      {props.children || (
        <>
          {copied() ? <Check size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={2} />}
          {copied() ? "已复制" : "复制"}
        </>
      )}
    </button>
  )
}
