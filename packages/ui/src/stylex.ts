import type * as stylex from "@stylexjs/stylex"
import type { CompiledStyles, InlineStyles, StyleXArray } from "@stylexjs/stylex"
import type { JSX } from "solid-js"

export type XStyle = StyleXArray<
  (null | undefined | CompiledStyles) | boolean | Readonly<[CompiledStyles, InlineStyles]>
>

export function toSolidStyle(
  style: ReturnType<typeof stylex.props>["style"],
): JSX.CSSProperties | undefined {
  return style as JSX.CSSProperties | undefined
}

export function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string | undefined {
  const className = classNames.filter((value): value is string => Boolean(value)).join(" ")
  return className.length > 0 ? className : undefined
}

export function mergeSolidStyles(
  ...styles: Array<JSX.CSSProperties | undefined>
): JSX.CSSProperties | undefined {
  let merged: JSX.CSSProperties | undefined

  for (const style of styles) {
    if (style === undefined) continue
    merged = { ...(merged ?? {}), ...style }
  }

  return merged
}
