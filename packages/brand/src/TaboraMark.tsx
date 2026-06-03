import { splitProps, type JSX } from "solid-js"

export type TaboraMarkProps = JSX.SvgSVGAttributes<SVGSVGElement> & {
  title?: string
}

export function TaboraMark(props: TaboraMarkProps) {
  const [local, rest] = splitProps(props, ["title", "aria-label"])
  const labelled = () => Boolean(local.title ?? local["aria-label"])

  return (
    <svg
      {...rest}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={labelled() ? "img" : undefined}
      aria-hidden={labelled() ? undefined : true}
      aria-label={local["aria-label"]}
    >
      {local.title ? <title>{local.title}</title> : null}
      <rect x="8" y="8" width="48" height="48" rx="14" fill="currentColor" />
      <path
        d="M20 22H44"
        stroke="white"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M32 22V42"
        stroke="white"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M24 42H40"
        stroke="white"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}
