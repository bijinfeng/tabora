export type Note = {
  id: string
  content: string
  tags?: string[]
  starred: boolean
  createdAt: string
  updatedAt: string
}

export const NOTES_STORAGE_KEY = "notes-items"
