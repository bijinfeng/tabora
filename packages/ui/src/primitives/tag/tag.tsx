import type { JSX } from "solid-js"
import X from "lucide-solid/icons/x"

export type TagProps = {
  bordered?: boolean | undefined
  closable?: boolean | undefined
  closeIcon?: JSX.Element | undefined
  closeAriaLabel?: string | undefined
  onClose?: ((event: MouseEvent) => void) | undefined
  onClick?: ((event: MouseEvent) => void) | undefined
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  closeButtonClass?: string | undefined
  closeButtonStyle?: JSX.CSSProperties | undefined
  children: JSX.Element
}

export function Tag(props: TagProps) {
  if (props.onClick && !props.closable) {
    return (
      <button
        type="button"
        class={props.class}
        style={props.style}
        data-bordered={props.bordered !== false ? "" : undefined}
        onClick={props.onClick}
      >
        {props.children}
      </button>
    )
  }

  return (
    <span
      class={props.class}
      style={props.style}
      data-bordered={props.bordered !== false ? "" : undefined}
    >
      {props.children}
      {props.closable && (
        <button
          type="button"
          class={props.closeButtonClass}
          style={props.closeButtonStyle}
          aria-label={props.closeAriaLabel ?? "移除标签"}
          onClick={(event) => {
            event.stopPropagation()
            props.onClose?.(event)
          }}
        >
          {props.closeIcon ?? <X size={12} strokeWidth={2} />}
        </button>
      )}
    </span>
  )
}

export type CheckableTagProps = {
  checked?: boolean | undefined
  onChange?: ((checked: boolean) => void) | undefined
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  children: JSX.Element
}

export function CheckableTag(props: CheckableTagProps) {
  return (
    <button
      type="button"
      class={props.class}
      style={props.style}
      aria-pressed={props.checked ?? false}
      data-checked={props.checked ? "" : undefined}
      onClick={() => props.onChange?.(!props.checked)}
    >
      {props.children}
    </button>
  )
}
