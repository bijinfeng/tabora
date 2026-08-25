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
  const preCompiled: Array<{ class?: string; style?: unknown }> = []
  const stylexArgs: Array<unknown> = []
  for (const arg of args) {
    if (
      arg != null &&
      typeof arg === "object" &&
      !Array.isArray(arg) &&
      ("class" in (arg as Record<string, unknown>) || "style" in (arg as Record<string, unknown>))
    ) {
      preCompiled.push(arg as { class?: string; style?: unknown })
    } else {
      stylexArgs.push(arg)
    }
  }
  const compiled = (stylex.attrs as (...a: Array<unknown>) => ReturnType<typeof stylex.attrs>)(
    ...stylexArgs,
  )
  const classes: string[] = []
  if (compiled.class) classes.push(compiled.class)
  for (const p of preCompiled) {
    if (p.class) classes.push(p.class)
  }
  let mergedObj: Record<string, unknown> | undefined
  let mergedStr: string | undefined
  if (typeof compiled.style === "string") mergedStr = compiled.style
  else if (compiled.style) mergedObj = { ...(compiled.style as Record<string, unknown>) }
  for (const p of preCompiled) {
    if (p.style == null) continue
    if (typeof p.style === "string") {
      mergedStr = mergedStr ? `${mergedStr}; ${p.style}` : p.style
    } else {
      mergedObj = mergedObj
        ? { ...mergedObj, ...(p.style as Record<string, unknown>) }
        : { ...(p.style as Record<string, unknown>) }
    }
  }
  let mergedStyle: string | Record<string, unknown> | undefined
  if (mergedStr && mergedObj) {
    mergedStyle = `${mergedStr}; ${Object.entries(mergedObj)
      .map(([k, v]) => {
        if (typeof v === "object") return `${k}:${JSON.stringify(v)}`
        if (typeof v === "string") return `${k}:${v}`
        if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint")
          return `${k}:${v.toString()}`
        return `${k}:`
      })
      .join(";")}`
  } else {
    mergedStyle = mergedStr ?? mergedObj
  }
  const result: { class?: string; style?: typeof compiled.style } = {}
  if (classes.length) result.class = classes.join(" ")
  if (mergedStyle != null) result.style = mergedStyle as any
  return result
}
