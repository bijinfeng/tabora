import * as stylex from "@stylexjs/stylex"
import type { CompiledStyles, InlineStyles, StyleXArray } from "@stylexjs/stylex"
import type { JSX } from "solid-js"

export type XStyle = StyleXArray<
  (null | undefined | CompiledStyles) | boolean | Readonly<[CompiledStyles, InlineStyles]>
>

export type SolidAttrs<T extends HTMLElement = HTMLElement> = Pick<
  JSX.HTMLAttributes<T>,
  "class" | "style"
>

export function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
): string | undefined {
  const className = classNames.filter((value): value is string => Boolean(value)).join(" ")
  return className.length > 0 ? className : undefined
}

export function sx(...args: Array<unknown>): {
  class?: string
  style?: ReturnType<typeof stylex.attrs>["style"]
} {
  const compiled = (stylex.attrs as (...a: Array<unknown>) => ReturnType<typeof stylex.attrs>)(
    ...args,
  )
  const result: { class?: string; style?: typeof compiled.style } = {}
  if ("class" in compiled && compiled.class) result.class = compiled.class
  if ("style" in compiled && compiled.style != null) result.style = compiled.style
  return result
}
