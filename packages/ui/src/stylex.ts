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
