import type { DocsExampleId } from "./docsExamples"

export type DocsSidebarGroup = {
  title: string
  items: Array<{
    id: string
    label: string
  }>
}

export type DocsCodeBlock = {
  label: string
  copyLabel: string
  copiedLabel: string
  copyId?: string
  code: string
}

export type DocsDemoSection = {
  title: string
  codeBlock?: DocsCodeBlock
  treeBlock?: {
    label: string
    code: string
  }
}

export type DocsTable = {
  columns: string[]
  rows: string[][]
}

export type DocsRegisteredDemo = {
  title: string
  exampleId: DocsExampleId
}

export type DocsLegacyDemo = {
  title: string
  previewHtml: string
  codeBlock: DocsCodeBlock
}

export type DocsComponentDemo = DocsRegisteredDemo | DocsLegacyDemo

export type DocsComponentSpec = {
  id: string
  title: string
  description: string
  metaTags: string[]
  anatomyTitle?: string
  anatomyItems?: string[]
  demos: DocsComponentDemo[]
  table: DocsTable
  doTitle: string
  doBody: string
  dontTitle: string
  dontBody: string
  pluginExample?: DocsCodeBlock
}

export type DocsPageContent = {
  sidebarTitle: string
  sidebarGroups: DocsSidebarGroup[]
  sections: {
    quickstart: {
      eyebrow: string
      title: string
      description: string
      demos: DocsDemoSection[]
    }
    manifest: {
      eyebrow: string
      title: string
      description: string
      anatomyTitle: string
      anatomyItems: string[]
      codeBlock: DocsCodeBlock
      table: DocsTable
    }
    runtime: {
      eyebrow: string
      title: string
      description: string
      demos: DocsDemoSection[]
      table: DocsTable
    }
    contributions: {
      eyebrow: string
      title: string
      description: string
      table: DocsTable
      doTitle: string
      doBody: string
      dontTitle: string
      dontBody: string
    }
    tokens: {
      eyebrow: string
      title: string
      description: string
      previewTitle: string
      swatches: Array<{
        name: string
        style: string
      }>
      table: DocsTable
    }
  }
  componentSpecs: {
    inputControls: DocsComponentSpec[]
    selectionControls: DocsComponentSpec[]
    overlayControls: DocsComponentSpec[]
    feedbackControls: DocsComponentSpec[]
    structureControls: DocsComponentSpec[]
  }
}

export const docsGuideSectionIds = [
  "quickstart",
  "manifest",
  "runtime",
  "contributions",
  "tokens",
] as const

export type DocsGuideSectionId = (typeof docsGuideSectionIds)[number]

export type DocsResolvedGuidePage = {
  kind: "guide"
  id: DocsGuideSectionId
  title: string
}

export type DocsResolvedComponentPage = {
  kind: "component"
  id: string
  title: string
  spec: DocsComponentSpec
}

export type DocsResolvedMissingPage = {
  kind: "missing"
  id: string
}

export type DocsResolvedPage =
  | DocsResolvedGuidePage
  | DocsResolvedComponentPage
  | DocsResolvedMissingPage
