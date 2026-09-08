export type Doc = {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  pinned?: boolean
}

export const DOCS_STORAGE_KEY = "docs-items"

/** Derives a display title from the doc, preferring an explicit title over the first line of content. */
export function docTitle(doc: Pick<Doc, "title" | "content">): string {
  const explicit = doc.title.trim()
  if (explicit) return explicit
  const text = doc.content
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return text ? text.slice(0, 40) : "未命名文档"
}
