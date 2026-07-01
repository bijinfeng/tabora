import { For, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Button, Field, Input, Select, Switch } from "@tabora/ui"
import { GripVertical, Pencil, Plus, Search, Trash2 } from "lucide-solid"
import { displayUrl, ICON_COLORS, initialsFromTitle, MAX_LINKS } from "./quick-links-data"
import { useQuickLinksExpandSession } from "./quick-links-expand-session"

export function QuickLinksExpand(props: WidgetViewProps) {
  const session = useQuickLinksExpandSession(props)
  const {
    links,
    groups,
    recentLink,
    panel,
    query,
    setQuery,
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
    filteredLinks,
    groupName,
    groupEntryCount,
    groupEntryNames,
    startAddEntry,
    startEditEntry,
    deleteEntry,
    toggleGroup,
    addGroup,
    loaded,
  } = session

  return (
    <div class="ql-expand-content">
      <div class="ql-expand-main">
        <Show when={panel() === "links"}>
          <div class="ql-panel" data-view="links">
            <div class="ql-section-head">
              <strong>常用入口</strong>
              <span>按最近访问排序</span>
            </div>
            <Input
              size="sm"
              value={query()}
              onInput={(value) => setQuery(value)}
              placeholder="搜索入口、粘贴网址或输入命令"
              aria-label="搜索快捷入口"
              leadingIcon={<Search size={14} />}
            />
            <div class="ql-link-table" aria-label="展开后的快捷入口列表">
              <Show when={loaded()} fallback={<p class="ql-empty">加载中...</p>}>
                <For each={filteredLinks()}>
                  {(link) => (
                    <div class="ql-link-row-wrapper">
                      <button
                        class="ql-link-row"
                        type="button"
                        onClick={() => startEditEntry(link)}
                      >
                        <span
                          class="ql-row-mark"
                          style={link.color ? { background: link.color, color: "#fff" } : undefined}
                        >
                          {initialsFromTitle(link.title)}
                        </span>
                        <span class="ql-row-copy">
                          <strong>{link.title}</strong>
                          <span>
                            {displayUrl(link.url)} · {groupName(link.groupId)}
                          </span>
                        </span>
                        <span class="ql-row-action-default">编</span>
                      </button>
                      <div class="ql-row-action-hover">
                        <button
                          class="ql-action-btn"
                          type="button"
                          aria-label="编辑"
                          onClick={() => startEditEntry(link)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          class="ql-action-btn ql-action-delete"
                          type="button"
                          aria-label="删除"
                          onClick={() => void deleteEntry(link.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </For>
                <button class="ql-link-row ql-link-row-add" type="button" onClick={startAddEntry}>
                  <span class="ql-row-mark">
                    <Plus size={14} />
                  </span>
                  <span class="ql-row-copy">
                    <strong>添加入口</strong>
                    <span>粘贴链接后自动补全标题与图标</span>
                  </span>
                  <span class="ql-row-action-default">加</span>
                </button>
                <Show when={filteredLinks().length === 0 && query().trim()}>
                  <p class="ql-empty">没有匹配 "{query().trim()}" 的入口</p>
                </Show>
              </Show>
            </div>
          </div>
        </Show>

        <Show when={panel() === "groups"}>
          <div class="ql-panel" data-view="groups">
            <div class="ql-section-head">
              <strong>管理分组</strong>
              <span>显示控制 · 新增分组</span>
            </div>
            <div class="ql-group-editor">
              <For each={groups()}>
                {(group) => (
                  <div class="ql-group-row">
                    <span class="ql-drag-grip" aria-hidden="true">
                      <GripVertical size={14} />
                    </span>
                    <span class="ql-group-copy">
                      <strong>{group.name}</strong>
                      <span>
                        {groupEntryNames(group.id)} · {groupEntryCount(group.id)} 个入口
                      </span>
                    </span>
                    <Switch
                      checked={group.visible}
                      onChange={() => void toggleGroup(group.id)}
                      aria-label={`${group.visible ? "隐藏" : "显示"}分组 ${group.name}`}
                    />
                  </div>
                )}
              </For>
            </div>
            <div class="ql-inline-create">
              <Input
                size="sm"
                value={newGroupName()}
                onInput={(value) => setNewGroupName(value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void addGroup()
                }}
                placeholder="新分组名称"
                aria-label="新分组名称"
              />
              <Button size="sm" variant="secondary" onClick={() => void addGroup()}>
                新增分组
              </Button>
            </div>
          </div>
        </Show>

        <Show when={panel() === "entry"}>
          <div class="ql-panel" data-view="entry">
            <div class="ql-section-head">
              <strong>添加入口</strong>
              <span>保存后进入当前分组</span>
            </div>
            <form class="ql-entry-form" onSubmit={(event) => event.preventDefault()}>
              <Field label="入口链接" htmlFor={`ql-entry-url-${props.instanceId}`}>
                <Input
                  size="sm"
                  type="url"
                  id={`ql-entry-url-${props.instanceId}`}
                  value={entryUrl()}
                  onInput={(value) => setEntryUrl(value)}
                  placeholder="https://example.com"
                  aria-label="入口链接"
                />
              </Field>
              <div class="ql-field-row">
                <Field label="显示名称" htmlFor={`ql-entry-title-${props.instanceId}`}>
                  <Input
                    size="sm"
                    id={`ql-entry-title-${props.instanceId}`}
                    value={entryTitle()}
                    onInput={(value) => setEntryTitle(value)}
                    placeholder="自动从链接补全"
                    aria-label="显示名称"
                  />
                </Field>
                <Field label="所属分组" htmlFor={`ql-entry-group-${props.instanceId}`}>
                  <Select
                    size="sm"
                    id={`ql-entry-group-${props.instanceId}`}
                    value={entryGroup()}
                    onChange={(value) => setEntryGroup(value)}
                    options={groups().map((group) => ({ value: group.id, label: group.name }))}
                    aria-label="所属分组"
                  />
                </Field>
              </div>
              <Field
                label="图标色"
                helper="粘贴链接后可手动编辑名称、分组和图标色。保存后插入到入口列表顶部，并同步卡片里的入口数量。"
              >
                <div class="ql-color-strip" role="group" aria-label="图标色">
                  <For each={ICON_COLORS}>
                    {(color) => (
                      <button
                        class="ql-swatch"
                        classList={{ "is-active": entryColor() === color }}
                        type="button"
                        style={{ "--ql-swatch": color }}
                        aria-label={`图标色 ${color}`}
                        aria-pressed={entryColor() === color}
                        onClick={() => setEntryColor(color)}
                      />
                    )}
                  </For>
                </div>
              </Field>
            </form>
          </div>
        </Show>
      </div>

      <aside class="ql-expand-side" aria-label="快捷入口配置">
        <div class="ql-section-head">
          <strong>配置</strong>
          <span>{groups().length} 组</span>
        </div>
        <div class="ql-info-card">
          <div class="ql-info-line">
            <span>入口数量</span>
            <strong>
              {links().length} / {MAX_LINKS}
            </strong>
          </div>
          <div class="ql-info-line">
            <span>打开方式</span>
            <strong>当前标签页</strong>
          </div>
          <div class="ql-info-line">
            <span>最近访问</span>
            <strong>{recentLink()?.title ?? "—"}</strong>
          </div>
        </div>
        <div class="ql-info-card">
          <div class="ql-section-head">
            <strong>分组</strong>
            <span>{groups().length} 组</span>
          </div>
          <div class="ql-group-chips">
            <For each={groups()}>
              {(group) => (
                <span class="ql-group-chip" classList={{ "is-hidden": !group.visible }}>
                  {group.name}
                </span>
              )}
            </For>
          </div>
        </div>
      </aside>
    </div>
  )
}
