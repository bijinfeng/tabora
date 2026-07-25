import { splitProps, type JSX } from "solid-js"

const taboraAppIconUrl = new URL("../assets/tabora-app-icon.svg", import.meta.url).href

export type TaboraMarkProps = Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, "alt" | "src"> & {
  title?: string
}

export function TaboraMark(props: TaboraMarkProps) {
  const [local, rest] = splitProps(props, ["title", "aria-label"])
  const labelled = () => Boolean(local.title ?? local["aria-label"])

  return (
    <img
      {...rest}
      src={taboraAppIconUrl}
      alt={local["aria-label"] ?? local.title ?? ""}
      aria-hidden={labelled() ? undefined : true}
      aria-label={local["aria-label"]}
    />
  )
}
