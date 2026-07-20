import type { JSX } from "solid-js"

export type AvatarProps = {
  src?: string
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl"
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  imgClass?: string | undefined
  imgStyle?: JSX.CSSProperties | undefined
  fallbackClass?: string | undefined
  fallbackStyle?: JSX.CSSProperties | undefined
}

export function Avatar(props: AvatarProps) {
  const initials = props.fallback?.slice(0, 2).toUpperCase() ?? "?"
  return (
    <span
      class={props.class}
      style={props.style}
      data-size={props.size ?? "md"}
      aria-label={props.alt ?? props.fallback}
    >
      {props.src ? (
        <img class={props.imgClass} style={props.imgStyle} src={props.src} alt={props.alt ?? ""} />
      ) : (
        <span class={props.fallbackClass} style={props.fallbackStyle}>
          {initials}
        </span>
      )}
    </span>
  )
}
