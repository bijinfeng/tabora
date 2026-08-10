import { splitProps, type Component, type JSX } from "solid-js"

export type TaboraMarkProps = JSX.SvgSVGAttributes<SVGSVGElement> & {
  title?: string
}

/**
 * Tabora 品牌 logo 组件，渲染为内联 SVG。
 * 源文件：`packages/brand/assets/tabora-app-icon.svg`
 */
export const TaboraMark: Component<TaboraMarkProps> = (props) => {
  const [local, rest] = splitProps(props, ["title", "aria-label", "class", "style"])
  const labelled = () => Boolean(local.title ?? local["aria-label"])

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 628 628"
      role="img"
      aria-labelledby={labelled() ? "tabora-logo-title" : undefined}
      aria-hidden={labelled() ? undefined : true}
      aria-label={local["aria-label"]}
      class={local.class}
      style={local.style}
      {...rest}
    >
      {labelled() && <title id="tabora-logo-title">{local.title ?? local["aria-label"]}</title>}
      <rect width="628" height="628" rx="152" fill="#1c1e1c" />
      <rect x="124" y="124" width="380" height="108" rx="46" fill="#ffffff" />
      <rect x="124" y="300" width="178" height="238" rx="50" fill="#ffffff" />
      <rect x="362" y="362" width="142" height="142" rx="44" fill="#1a9070" />
    </svg>
  )
}
