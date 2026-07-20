import type { CompiledStyles, InlineStyles, StyleXArray } from "@stylexjs/stylex"

export type XStyle = StyleXArray<
  (null | undefined | CompiledStyles) | boolean | Readonly<[CompiledStyles, InlineStyles]>
>
