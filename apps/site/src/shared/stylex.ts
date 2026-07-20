import * as stylex from "@stylexjs/stylex"
import type { CompiledStyles, InlineStyles, StyleXArray } from "@stylexjs/stylex"
import type { JSX } from "solid-js"

export type XStyle = StyleXArray<
  (null | undefined | CompiledStyles) | boolean | Readonly<[CompiledStyles, InlineStyles]>
>

export function sx(...styles: XStyle[]): {
  class: string | undefined
  style: JSX.CSSProperties | undefined
} {
  const compiled = stylex.props(...styles)

  return {
    class: compiled.className,
    style: compiled.style as JSX.CSSProperties | undefined,
  }
}
