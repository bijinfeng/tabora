import * as stylex from "@stylexjs/stylex"
import { For, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Button, Field, IconButton, Input, Select, Switch } from "@tabora/ui"
import { GripVertical, Pencil, Plus, Search, Trash2 } from "lucide-solid"
import { displayUrl, ICON_COLORS, initialsFromTitle, MAX_LINKS } from "./quick-links-data"
import { useQuickLinksExpandSession } from "./quick-links-expand-session"
import { styles } from "./styles"

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
    <div {...stylex.attrs(styles.expand)} data-widget-expand="quick-links">
      <div {...stylex.attrs(styles.main)}>
        <Show when={panel() === "links"}>
          <div {...stylex.attrs(styles.panel)} data-view="links">
            <div {...stylex.attrs(styles.sectionHead)}>
              <strong {...stylex.attrs(styles.sectionTitle)}>常用入口</strong>
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
            <div {...stylex.attrs(styles.list)} aria-label="展开后的快捷入口列表">
              <Show when={loaded()} fallback={<p {...stylex.attrs(styles.empty)}>加载中...</p>}>
                <For each={filteredLinks()}>
                  {(link) => (
                    <div {...stylex.attrs(styles.rowWrap)}>
                      <Button
                        size="md"
                        variant="ghost"
                        xstyle={styles.row}
                        data-quick-link-row
                        onClick={() => startEditEntry(link)}
                      >
                        <span
                          {...stylex.attrs(styles.rowMark)}
                          style={link.color ? { background: link.color, color: "#fff" } : undefined}
                        >
                          {initialsFromTitle(link.title)}
                        </span>
                        <span {...stylex.attrs(styles.copy)}>
                          <strong {...stylex.attrs(styles.primary)}>{link.title}</strong>
                          <span {...stylex.attrs(styles.secondary)}>
                            {displayUrl(link.url)} · {groupName(link.groupId)}
                          </span>
                        </span>
                      </Button>
                      <div {...stylex.attrs(styles.rowActions)}>
                        <IconButton
                          size="sm"
                          variant="ghost"
                          xstyle={styles.rowAction}
                          aria-label="编辑"
                          onClick={() => startEditEntry(link)}
                        >
                          <Pencil size={14} />
                        </IconButton>
                        <IconButton
                          size="sm"
                          variant="danger"
                          xstyle={[styles.rowAction, styles.deleteAction]}
                          aria-label="删除"
                          onClick={() => void deleteEntry(link.id)}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    </div>
                  )}
                </For>
                <Button
                  size="md"
                  variant="ghost"
                  xstyle={[styles.row, styles.rowAdd]}
                  onClick={startAddEntry}
                >
                  <span {...stylex.attrs(styles.rowMark)}>
                    <Plus size={14} />
                  </span>
                  <span {...stylex.attrs(styles.copy)}>
                    <strong {...stylex.attrs(styles.primary)}>添加入口</strong>
                    <span {...stylex.attrs(styles.secondary)}>粘贴链接后自动补全标题与图标</span>
                  </span>
                </Button>
                <Show when={filteredLinks().length === 0 && query().trim()}>
                  <p {...stylex.attrs(styles.empty)}>没有匹配 "{query().trim()}" 的入口</p>
                </Show>
              </Show>
            </div>
          </div>
        </Show>

        <Show when={panel() === "groups"}>
          <div {...stylex.attrs(styles.panel)} data-view="groups">
            <div {...stylex.attrs(styles.sectionHead)}>
              <strong {...stylex.attrs(styles.sectionTitle)}>管理分组</strong>
              <span>显示控制 · 新增分组</span>
            </div>
            <div {...stylex.attrs(styles.groupList)}>
              <For each={groups()}>
                {(group) => (
                  <div {...stylex.attrs(styles.groupRow)}>
                    <span {...stylex.attrs(styles.grip)} aria-hidden="true">
                      <GripVertical size={14} />
                    </span>
                    <span {...stylex.attrs(styles.copy)}>
                      <strong {...stylex.attrs(styles.primary)}>{group.name}</strong>
                      <span {...stylex.attrs(styles.secondary)}>
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
            <div {...stylex.attrs(styles.inlineCreate)}>
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
          <div {...stylex.attrs(styles.panel)} data-view="entry">
            <div {...stylex.attrs(styles.sectionHead)}>
              <strong {...stylex.attrs(styles.sectionTitle)}>添加入口</strong>
              <span>保存后进入当前分组</span>
            </div>
            <form {...stylex.attrs(styles.form)} onSubmit={(event) => event.preventDefault()}>
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
              <div {...stylex.attrs(styles.fieldRow)}>
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
                <div {...stylex.attrs(styles.colors)} role="group" aria-label="图标色">
                  <For each={ICON_COLORS}>
                    {(color) => (
                      <IconButton
                        size="sm"
                        variant="ghost"
                        xstyle={[styles.swatch, entryColor() === color && styles.swatchActive]}
                        style={{ "--ql-swatch": color }}
                        aria-label={`图标色 ${color}`}
                        aria-pressed={entryColor() === color}
                        onClick={() => setEntryColor(color)}
                      >
                        <span aria-hidden="true" />
                      </IconButton>
                    )}
                  </For>
                </div>
              </Field>
            </form>
          </div>
        </Show>
      </div>

      <aside {...stylex.attrs(styles.side)} data-quick-links-side aria-label="快捷入口配置">
        <div {...stylex.attrs(styles.sectionHead)}>
          <strong {...stylex.attrs(styles.sectionTitle)}>配置</strong>
          <span>{groups().length} 组</span>
        </div>
        <div {...stylex.attrs(styles.infoCard)}>
          <div {...stylex.attrs(styles.infoLine)}>
            <span>入口数量</span>
            <strong {...stylex.attrs(styles.infoValue)}>
              {links().length} / {MAX_LINKS}
            </strong>
          </div>
          <div {...stylex.attrs(styles.infoLine)}>
            <span>打开方式</span>
            <strong {...stylex.attrs(styles.infoValue)}>当前标签页</strong>
          </div>
          <div {...stylex.attrs(styles.infoLine)}>
            <span>最近访问</span>
            <strong {...stylex.attrs(styles.infoValue)}>{recentLink()?.title ?? "—"}</strong>
          </div>
        </div>
        <div {...stylex.attrs(styles.infoCard)}>
          <div {...stylex.attrs(styles.sectionHead)}>
            <strong {...stylex.attrs(styles.sectionTitle)}>分组</strong>
            <span>{groups().length} 组</span>
          </div>
          <div {...stylex.attrs(styles.chips)}>
            <For each={groups()}>
              {(group) => (
                <span {...stylex.attrs(styles.chip, !group.visible && styles.chipHidden)}>
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
