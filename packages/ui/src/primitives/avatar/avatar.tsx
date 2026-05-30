export type AvatarProps = {
  src?: string
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl"
  class?: string
}

export function Avatar(props: AvatarProps) {
  const initials = props.fallback?.slice(0, 2).toUpperCase() ?? "?"
  return (
    <span
      class={props.class}
      data-size={props.size ?? "md"}
      aria-label={props.alt ?? props.fallback}
    >
      {props.src ? <img src={props.src} alt={props.alt ?? ""} /> : <span>{initials}</span>}
    </span>
  )
}
