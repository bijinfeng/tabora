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

export function createDefaultTodoItems(options?: { includeAssignees?: boolean }): TodoItem[] {
  const includeAssignees = options?.includeAssignees ?? false
  return [
    {
      id: "seed-1",
      text: "复核 Dashboard 布局协议",
      done: true,
      priority: "high",
      groupId: DEFAULT_GROUP_ID,
    },
    {
      id: "seed-2",
      text: "补齐 widget 尺寸菜单",
      done: false,
      priority: "medium",
      dueDate: "2025-12-31",
      groupId: DEFAULT_GROUP_ID,
      ...(includeAssignees ? { assignee: "毕金风" } : {}),
    },
    {
      id: "seed-3",
      text: "清理插件设置中的导入导出项",
      done: false,
      priority: "low",
      groupId: DEFAULT_GROUP_ID,
      ...(includeAssignees ? { assignee: "毕金风" } : {}),
    },
  ]
}
