import { docsGuideSectionIds } from "./docsPageContent.types"
import type {
  DocsComponentSpec,
  DocsGuideSectionId,
  DocsPageContent,
  DocsResolvedPage,
} from "./docsPageContent.types"

export const defaultDocsSectionId = "quickstart"

export function getDocsSectionPath(id: string) {
  return `/docs/${id}`
}

export function getDocsComponentSpecs(content: DocsPageContent): DocsComponentSpec[] {
  return [
    ...content.componentSpecs.inputControls,
    ...content.componentSpecs.selectionControls,
    ...content.componentSpecs.overlayControls,
    ...content.componentSpecs.feedbackControls,
    ...content.componentSpecs.structureControls,
  ]
}

export function resolveDocsPage(
  content: DocsPageContent,
  requestedId = defaultDocsSectionId,
): DocsResolvedPage {
  const id = requestedId || defaultDocsSectionId
  if (isDocsGuideSectionId(id)) {
    return {
      kind: "guide",
      id,
      title: content.sections[id].title,
    }
  }

  const spec = getDocsComponentSpecs(content).find((item) => item.id === id)
  if (spec) {
    return {
      kind: "component",
      id,
      title: spec.title,
      spec,
    }
  }

  return {
    kind: "missing",
    id,
  }
}

function isDocsGuideSectionId(id: string): id is DocsGuideSectionId {
  return docsGuideSectionIds.includes(id as DocsGuideSectionId)
}
