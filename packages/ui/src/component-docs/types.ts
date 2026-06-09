import type { JSX } from "solid-js"

export type ComponentDocNavItem = {
  id: string
  name: string
}

export type ComponentDocsCategory = {
  title: string
  items: ComponentDocNavItem[]
}

export type ComponentDocItem = ComponentDocNavItem & {
  title: string
  purpose: string
  usage: string
  code: string
}

export type ComponentDocDemoProps = {
  id: string
}

export type ComponentDocDemoRenderer = (props: ComponentDocDemoProps) => JSX.Element
