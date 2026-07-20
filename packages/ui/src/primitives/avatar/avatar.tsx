import type { JSX } from "solid-js"

import type { SolidAttrs } from "../../stylex"

export type AvatarProps = {
  src?: string
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl"
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  attrs?: SolidAttrs<HTMLSpanElement>
  imgClass?: string | undefined
  imgStyle?: JSX.CSSProperties | undefined
  imgAttrs?: SolidAttrs<HTMLImageElement>
  fallbackClass?: string | undefined
  fallbackStyle?: JSX.CSSProperties | undefined
  fallbackAttrs?: SolidAttrs<HTMLSpanElement>
}

export function Avatar(props: AvatarProps) {
  const initials = props.fallback?.slice(0, 2).toUpperCase() ?? "?"
  const attrs = (): SolidAttrs<HTMLSpanElement> =>
    props.attrs ?? { class: props.class, style: props.style }
  const imgAttrs = (): SolidAttrs<HTMLImageElement> =>
    props.imgAttrs ?? { class: props.imgClass, style: props.imgStyle }
  const fallbackAttrs = (): SolidAttrs<HTMLSpanElement> =>
    props.fallbackAttrs ?? { class: props.fallbackClass, style: props.fallbackStyle }

  return (
    <span {...attrs()} data-size={props.size ?? "md"} aria-label={props.alt ?? props.fallback}>
      {props.src ? (
        <img {...imgAttrs()} src={props.src} alt={props.alt ?? ""} />
      ) : (
        <span {...fallbackAttrs()}>{initials}</span>
      )}
    </span>
  )
}
