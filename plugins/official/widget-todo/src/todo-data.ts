export type Priority = "high" | "medium" | "low" | "none"

export type TodoItem = {
  id: string
  text: string
  done: boolean
  priority: Priority
  dueDate?: string
  groupId: string
  assignee?: string
}

export type TodoGroup = {
  id: string
  name: string
  collapsed: boolean
}

export const DEFAULT_GROUP_ID = "default"
export const TODO_ITEMS_KEY = "v2_items"
export const TODO_GROUPS_KEY = "v2_groups"
