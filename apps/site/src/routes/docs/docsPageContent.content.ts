import type { SiteLocale } from "../../app/AppShell"

import type { DocsPageContent } from "./docsPageContent.types"
import { enDocsPageContent } from "./docsPageContent.content.en"
import { zhCNDocsPageContent } from "./docsPageContent.content.zh-CN"

export const docsPageContentByLocale: Record<SiteLocale, DocsPageContent> = {
  "zh-CN": zhCNDocsPageContent,
  en: enDocsPageContent,
}
