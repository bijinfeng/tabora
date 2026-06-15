import type { SiteLocale } from "../../app/AppShell"

import type { DocsPageContent } from "./docsPageContent.types"
import { docsPageContentByLocale } from "./docsPageContent.content"

export type {
  DocsCodeBlock,
  DocsComponentDemo,
  DocsComponentSpec,
  DocsDemoSection,
  DocsGuideSectionId,
  DocsLegacyDemo,
  DocsPageContent,
  DocsRegisteredDemo,
  DocsResolvedComponentPage,
  DocsResolvedGuidePage,
  DocsResolvedMissingPage,
  DocsResolvedPage,
  DocsSidebarGroup,
  DocsTable,
} from "./docsPageContent.types"
export { docsGuideSectionIds } from "./docsPageContent.types"
export {
  defaultDocsSectionId,
  getDocsComponentSpecs,
  getDocsSectionPath,
  resolveDocsPage,
} from "./docsPageContent.resolve"

export function getDocsPageContent(locale: SiteLocale): DocsPageContent {
  return docsPageContentByLocale[locale]
}
