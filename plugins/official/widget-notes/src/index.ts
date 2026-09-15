import type { AiRuntimeBridge, PluginModule } from "@tabora/plugin-api/sdk"
import { NotesCard } from "./notes-card"
import { NotesExpand } from "./notes-expand"
import { getAllCachedNotes, NOTES_STORAGE_KEY, type Note } from "./notes-data"
import { officialPluginNotesManifest } from "./manifest"

export const officialPluginNotes: PluginModule = {
  manifest: officialPluginNotesManifest,
  activate(context) {
    notesAiRuntime = context.ai
    context.views.register("official.widgets.notes.card", NotesCard)
    context.views.register("official.widgets.notes.expand", NotesExpand)
    context.aiTools?.register("official.widgets.notes.search-notes", async ({ args }) => {
      const params = args as { query?: unknown; limit?: unknown }
      const rawQuery = typeof params.query === "string" ? params.query.trim() : ""
      const query = rawQuery.toLocaleLowerCase()
      const limit =
        typeof params.limit === "number" && Number.isFinite(params.limit)
          ? Math.min(10, Math.max(1, Math.floor(params.limit)))
          : 5
      type Scored = {
        instanceId: string
        note: Note
        score: number
        snippet: string
      }
      const matches: Scored[] = []
      const haystacks = getAllCachedNotes()
      for (const { instanceId, note } of haystacks) {
        const text = stripTags(note.content).toLocaleLowerCase()
        const tags = (note.tags ?? []).join(" ").toLocaleLowerCase()
        if (!query) {
          matches.push({
            instanceId,
            note,
            score: note.starred ? 2 : 1,
            snippet: snippetize(stripTags(note.content)),
          })
          continue
        }
        const hits =
          countHits(text, query) * 2 + countHits(tags, query) * 5 + (note.starred ? 1 : 0)
        if (hits > 0) {
          matches.push({
            instanceId,
            note,
            score: hits,
            snippet: snippetize(stripTags(note.content), query),
          })
        }
      }
      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return b.note.updatedAt.localeCompare(a.note.updatedAt)
      })
      const top = matches.slice(0, limit)
      return {
        query: rawQuery,
        total: matches.length,
        cachedInstances: new Set(haystacks.map((h) => h.instanceId)).size,
        results: top.map((m) => ({
          instanceId: m.instanceId,
          noteId: m.note.id,
          starred: m.note.starred,
          tags: m.note.tags ?? [],
          updatedAt: m.note.updatedAt,
          snippet: m.snippet,
        })),
      }
    })
  },
}

let notesAiRuntime: AiRuntimeBridge | undefined

/** Views are registered by this module and consume only the plugin-scoped runtime bridge. */
export function getNotesAiRuntime(): AiRuntimeBridge | undefined {
  return notesAiRuntime
}

// Lightweight text helpers — intentionally kept local to avoid pulling DOM/DOMPurify deps.
function stripTags(html: string): string {
  if (!html) return ""
  const lower = html.toLocaleLowerCase()
  const scriptFree = lower.replace(/<script[\s\S]*?<\/script>/gi, "")
  return scriptFree
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function countHits(text: string, needle: string): number {
  if (!needle) return 0
  let count = 0
  let from = 0
  while (true) {
    const idx = text.indexOf(needle, from)
    if (idx < 0) break
    count += 1
    from = idx + needle.length
  }
  return count
}

function snippetize(text: string, query = "", width = 120): string {
  const cleaned = text.length <= width * 2 ? text : `${text.slice(0, width * 2 - 1)}…`
  if (!query) return cleaned
  const lower = cleaned.toLocaleLowerCase()
  const idx = lower.indexOf(query)
  if (idx < 0) return cleaned
  const start = Math.max(0, idx - Math.floor(width / 2))
  const end = Math.min(cleaned.length, idx + query.length + Math.floor(width / 2))
  const prefix = start > 0 ? "…" : ""
  const suffix = end < cleaned.length ? "…" : ""
  return `${prefix}${cleaned.slice(start, end)}${suffix}`
}

// Referenced to silence unused-import lint in manifests that declare the storage key.
void NOTES_STORAGE_KEY
