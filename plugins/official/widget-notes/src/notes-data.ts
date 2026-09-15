export type Note = {
  id: string
  content: string
  tags?: string[]
  starred: boolean
  createdAt: string
  updatedAt: string
}

export const NOTES_STORAGE_KEY = "notes-items"

/**
 * Module-level cache of notes per widget instance id, populated by the view
 * components during mount and every persist call. This is the bridge between
 * WidgetViewData (component-scoped) and aiTools (activate-scoped) without
 * requiring the host storage repository to be exposed on PluginContext.
 */
export const instanceNotesCache = new Map<string, Note[]>()

export function setInstanceNotes(instanceId: string, notes: Note[]): void {
  instanceNotesCache.set(instanceId, notes.slice())
}

export function clearInstanceNotes(instanceId: string): void {
  instanceNotesCache.delete(instanceId)
}

export function getAllCachedNotes(): Array<{ instanceId: string; note: Note }> {
  const rows: Array<{ instanceId: string; note: Note }> = []
  for (const [instanceId, notes] of instanceNotesCache) {
    for (const note of notes) rows.push({ instanceId, note })
  }
  return rows
}
