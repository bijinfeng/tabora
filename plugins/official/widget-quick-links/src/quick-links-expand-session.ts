import { createMemo, createSignal, onCleanup, type Accessor } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import {
  DEFAULT_GROUPS,
  displayUrl,
  getDefaultLinks,
  GROUPS_KEY,
  ICON_COLORS,
  isValidUrl,
  LINKS_KEY,
  makeId,
  MAX_LINKS,
  RECENT_KEY,
  type QuickGroup,
  type QuickLink,
} from "./quick-links-data"

export type Panel = "links" | "groups" | "entry"

export type QuickLinksExpandSession = ReturnType<typeof createSession>

type SessionEntry = {
  session: QuickLinksExpandSession
  refs: number
}

// expand 主体视图与 footer 视图是两个独立组件，但同属一次展开会话。
// 用 instanceId 维度共享一份响应式会话状态；引用计数归零时清理，避免泄漏。
const sessions = new Map<string, SessionEntry>()

function createSession(props: WidgetViewProps) {
  const [links, setLinks] = createSignal<QuickLink[]>([])
  const [groups, setGroups] = createSignal<QuickGroup[]>(DEFAULT_GROUPS)
  const [recentId, setRecentId] = createSignal<string | null>(null)
  const [panel, setPanel] = createSignal<Panel>("links")
  const [query, setQuery] = createSignal("")
  const [urlError, setUrlError] = createSignal<string | null>(null)
  const [loaded, setLoaded] = createSignal(false)

  // 添加入口表单
  const [editingId, setEditingId] = createSignal<string | null>(null)
  const [entryUrl, setEntryUrl] = createSignal("")
  const [entryTitle, setEntryTitle] = createSignal("")
  const [entryGroup, setEntryGroup] = createSignal<string>(DEFAULT_GROUPS[0]!.id)
  const [entryColor, setEntryColor] = createSignal<string>(ICON_COLORS[0])

  // 新增分组
  const [newGroupName, setNewGroupName] = createSignal("")

  void (async () => {
    let savedLinks = await props.data.get<QuickLink[]>(LINKS_KEY)
    if (!savedLinks || savedLinks.length === 0) {
      savedLinks = getDefaultLinks(props.config)
      await props.data.save(LINKS_KEY, savedLinks)
    }
    setLinks(savedLinks)

    const savedGroups = await props.data.get<QuickGroup[]>(GROUPS_KEY)
    if (savedGroups && savedGroups.length > 0) {
      setGroups(savedGroups)
      setEntryGroup(savedGroups[0]!.id)
    }

    const savedRecent = await props.data.get<string>(RECENT_KEY)
    if (savedRecent) setRecentId(savedRecent)
    setLoaded(true)
  })()

  async function persistLinks(updated: QuickLink[]) {
    setLinks(updated)
    await props.data.save(LINKS_KEY, updated)
  }

  async function persistGroups(updated: QuickGroup[]) {
    setGroups(updated)
    await props.data.save(GROUPS_KEY, updated)
  }

  function groupName(id?: string): string {
    if (!id) return "未分组"
    return groups().find((g) => g.id === id)?.name ?? "未分组"
  }

  const filteredLinks = createMemo(() => {
    const q = query().trim().toLowerCase()
    const all = links()
    if (!q) return all
    return all.filter(
      (link) =>
        link.title.toLowerCase().includes(q) || displayUrl(link.url).toLowerCase().includes(q),
    )
  })

  const recentLink = createMemo(() => links().find((link) => link.id === recentId()) ?? null)

  function groupEntryCount(id: string): number {
    return links().filter((link) => link.groupId === id).length
  }

  function groupEntryNames(id: string): string {
    const names = links()
      .filter((link) => link.groupId === id)
      .map((link) => link.title)
    return names.length > 0 ? names.join(" / ") : "暂无入口"
  }

  async function openLink(link: QuickLink) {
    setRecentId(link.id)
    await props.data.save(RECENT_KEY, link.id)
    await props.host.openExternal(link.url)
  }

  function startAddEntry() {
    setEditingId(null)
    setEntryUrl("")
    setEntryTitle("")
    setEntryGroup(groups()[0]?.id ?? DEFAULT_GROUPS[0]!.id)
    setEntryColor(ICON_COLORS[0])
    setUrlError(null)
    setPanel("entry")
  }

  function startEditEntry(link: QuickLink) {
    setEditingId(link.id)
    setEntryUrl(link.url)
    setEntryTitle(link.title)
    setEntryGroup(link.groupId ?? groups()[0]?.id ?? DEFAULT_GROUPS[0]!.id)
    setEntryColor(link.color || ICON_COLORS[0])
    setUrlError(null)
    setPanel("entry")
  }

  async function saveEntry() {
    const title = entryTitle().trim() || displayUrl(entryUrl()) || "新入口"
    const url = entryUrl().trim()
    if (!isValidUrl(url)) {
      setUrlError("请输入有效的 https:// URL")
      return
    }

    const editId = editingId()
    if (editId) {
      // 更新现有入口
      const next = links().map((link) =>
        link.id === editId
          ? { ...link, title, url, groupId: entryGroup(), color: entryColor() }
          : link,
      )
      await persistLinks(next)
      props.host.showToast(`已更新入口 ${title}`, { type: "success" })
    } else {
      // 添加新入口
      if (links().length >= MAX_LINKS) {
        setUrlError(`入口数量已达上限 ${MAX_LINKS} 个`)
        return
      }
      setUrlError(null)
      const next: QuickLink[] = [
        { id: makeId(), title, url, groupId: entryGroup(), color: entryColor() },
        ...links(),
      ]
      await persistLinks(next)
      props.host.showToast(`已添加入口 ${title}`, { type: "success" })
    }
    setPanel("links")
  }

  async function deleteEntry(id: string) {
    const link = links().find((l) => l.id === id)
    if (!link) return
    const next = links().filter((l) => l.id !== id)
    await persistLinks(next)
    props.host.showToast(`已删除入口 ${link.title}`, { type: "success" })
  }

  async function toggleGroup(id: string) {
    const next = groups().map((g) => (g.id === id ? { ...g, visible: !g.visible } : g))
    await persistGroups(next)
  }

  async function addGroup() {
    const name = newGroupName().trim()
    if (!name) return
    const next: QuickGroup[] = [...groups(), { id: makeId(), name, visible: true }]
    await persistGroups(next)
    setNewGroupName("")
  }

  function toggleManageGroups() {
    // entry 面板时左键为「取消」，回到列表；links↔groups 互切
    setPanel(panel() === "links" ? "groups" : "links")
  }

  function primaryAction() {
    if (panel() === "entry") {
      void saveEntry()
      return
    }
    startAddEntry()
  }

  return {
    instanceId: props.instanceId,
    // state
    links,
    groups,
    recentLink,
    panel,
    setPanel,
    query,
    setQuery,
    urlError,
    loaded,
    editingId,
    entryUrl,
    setEntryUrl,
    entryTitle,
    setEntryTitle,
    entryGroup,
    setEntryGroup,
    entryColor,
    setEntryColor,
    newGroupName,
    setNewGroupName,
    // derived / helpers
    filteredLinks,
    groupName,
    groupEntryCount,
    groupEntryNames,
    // actions
    openLink,
    startAddEntry,
    startEditEntry,
    saveEntry,
    deleteEntry,
    toggleGroup,
    addGroup,
    toggleManageGroups,
    primaryAction,
  }
}

/**
 * 取得（或创建）某个 widget 实例的展开会话。
 * body 与 footer 两个视图调用同一 instanceId 即可共享状态。
 * 通过 onCleanup 引用计数，最后一个使用者卸载时销毁会话。
 */
export function useQuickLinksExpandSession(props: WidgetViewProps): QuickLinksExpandSession {
  let entry = sessions.get(props.instanceId)
  if (!entry) {
    entry = { session: createSession(props), refs: 0 }
    sessions.set(props.instanceId, entry)
  }
  entry.refs += 1

  onCleanup(() => {
    const current = sessions.get(props.instanceId)
    if (!current) return
    current.refs -= 1
    if (current.refs <= 0) sessions.delete(props.instanceId)
  })

  return entry.session
}

export type { Accessor }
