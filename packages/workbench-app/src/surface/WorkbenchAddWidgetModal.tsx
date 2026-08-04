import * as stylex from "@stylexjs/stylex"
import { createEffect, createMemo, createSignal, For, onCleanup, Show } from "solid-js"
import type { JSX } from "solid-js"
import { widgetGridColumnSpan, widgetGridRowSpan } from "@tabora/plugin-api"
import type { WidgetSize } from "@tabora/plugin-api"
import Search from "lucide-solid/icons/search"
import X from "lucide-solid/icons/x"
import { Button, IconButton } from "@tabora/ui/button"
import { Input } from "@tabora/ui/input"
import { WidgetCardShell, type WidgetHostCallbacks } from "@tabora/workbench-shell"

import type { ShellTranslation } from "../i18n"
import type { AvailableWidget } from "./WorkbenchShellChrome.types"
import { styles } from "./WorkbenchAddWidgetModal.styles"

type Category = "info" | "productivity" | "tools" | "installed"

const CATEGORY_LABELS: Record<Category, string> = {
  info: "信息",
  productivity: "生产力",
  tools: "工具",
  installed: "已安装",
}

const SIZE_OPTIONS: WidgetSize[] = ["S", "M", "L", "XL"]

// 预览舞台的单元边长（正方，px）。S=1x1、M=2x1、L=2x2、XL=4x2 都按此边长排布，
// 保证各尺寸比例真实，且 XL(4 单元宽) 仍能容纳在预览区可视宽度内。
const PREVIEW_UNIT = 76

// 列表内的展示优先级——越靠前展示越早。可根据数据补充。
const FEATURED_ORDER = ["quick-links", "todo", "notes", "weather"]

function featuredRank(widget: AvailableWidget): number {
  const idLower = widget.id.toLowerCase()
  const pluginLower = widget.pluginId.toLowerCase()
  for (let i = 0; i < FEATURED_ORDER.length; i++) {
    const key = FEATURED_ORDER[i]!
    if (idLower.includes(key) || pluginLower.includes(key)) return i
  }
  return FEATURED_ORDER.length
}

// 没有"推荐"桶了，未命中信息 / 生产力关键词的卡片归到"工具"，
// 否则它们会落进一个没有对应 tab 的分类里，筛选时永远看不到。
function bucketCategory(widget: AvailableWidget): Category {
  const id = `${widget.pluginId}.${widget.id}`.toLowerCase()
  if (/weather|news|stock|info/.test(id)) return "info"
  if (/todo|notes|today|focus|task/.test(id)) return "productivity"
  return "tools"
}

function defaultSize(widget: AvailableWidget): WidgetSize {
  return widget.defaultSize ?? widget.supportedSizes?.[0] ?? "M"
}

function applyVars(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g"), String(value))
  }
  return result
}

export function WorkbenchAddWidgetModal(props: {
  open: boolean
  availableWidgets: AvailableWidget[]
  renderWidgetIcon: (icon?: string) => JSX.Element
  renderWidgetPreview?: (pluginId: string, widgetId: string, size: WidgetSize) => JSX.Element
  tShell?: ShellTranslation
  activeGroupLabel?: string
  onAdd: (pluginId: string, widgetId: string, size?: WidgetSize) => void
  onClose: () => void
}) {
  const [query, setQuery] = createSignal("")
  const [activeCategory, setActiveCategory] = createSignal<Category | "all">("all")
  const [selectedIndex, setSelectedIndex] = createSignal(0)
  const [chosenSize, setChosenSize] = createSignal<WidgetSize | null>(null)

  const t = (key: string, fallback: string, vars?: Record<string, string | number>) => {
    if (!props.tShell) return applyVars(fallback, vars)
    const value = props.tShell(key, vars)
    // i18n store 找不到 key 时会返回 "<pluginId>.<key>"，此处回退到 fallback
    if (value === key || value.endsWith(`.${key}`)) return applyVars(fallback, vars)
    return value
  }

  const widgetsWithCategory = createMemo(() => {
    const list = props.availableWidgets.map((widget) => ({
      widget,
      category: bucketCategory(widget),
    }))
    list.sort((left, right) => featuredRank(left.widget) - featuredRank(right.widget))
    return list
  })

  const filteredWidgets = createMemo(() => {
    const q = query().trim().toLowerCase()
    const cat = activeCategory()
    return widgetsWithCategory().filter(({ widget, category }) => {
      if (cat !== "all" && category !== cat) return false
      if (!q) return true
      return (
        widget.title.toLowerCase().includes(q) ||
        (widget.description?.toLowerCase().includes(q) ?? false) ||
        widget.pluginId.toLowerCase().includes(q)
      )
    })
  })

  const selectedWidget = createMemo<AvailableWidget | undefined>(() => {
    const list = filteredWidgets()
    if (list.length === 0) return undefined
    const idx = Math.min(selectedIndex(), list.length - 1)
    return list[idx]?.widget
  })

  const effectiveSize = createMemo<WidgetSize | undefined>(() => {
    const widget = selectedWidget()
    if (!widget) return undefined
    const chosen = chosenSize()
    if (chosen && widget.supportedSizes?.includes(chosen)) return chosen
    return defaultSize(widget)
  })

  function handleSelect(index: number) {
    setSelectedIndex(index)
    setChosenSize(null)
  }

  function handleConfirm() {
    const widget = selectedWidget()
    if (!widget) return
    props.onAdd(widget.pluginId, widget.id, effectiveSize())
  }

  function handleOverlayKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault()
      props.onClose()
    } else if (event.key === "Enter" && !event.isComposing) {
      const target = event.target as HTMLElement | null
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return
      event.preventDefault()
      handleConfirm()
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      const list = filteredWidgets()
      if (list.length === 0) return
      setSelectedIndex((idx) => Math.min(idx + 1, list.length - 1))
      setChosenSize(null)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setSelectedIndex((idx) => Math.max(idx - 1, 0))
      setChosenSize(null)
    }
  }

  // 键盘事件挂在 overlay 上，只有焦点落在 overlay 子树里才会冒泡到这里。
  // 打开时若不主动聚焦，Esc / Enter / 上下键在用户点进弹窗前全部失效。
  // 关闭时把焦点还给打开弹窗的元素，避免焦点掉回 body。
  let overlayRef: HTMLDivElement | undefined
  let restoreFocusTo: HTMLElement | null = null

  createEffect(() => {
    if (!props.open) return
    const previous = document.activeElement
    restoreFocusTo = previous instanceof HTMLElement ? previous : null
    overlayRef?.focus()

    onCleanup(() => {
      restoreFocusTo?.focus()
      restoreFocusTo = null
    })
  })

  return (
    <Show when={props.open}>
      <div
        {...stylex.attrs(styles.overlay)}
        ref={(element) => (overlayRef = element)}
        data-workbench-overlay="add-widget"
        onClick={props.onClose}
        onKeyDown={handleOverlayKeyDown}
        tabIndex={-1}
      >
        <div
          {...stylex.attrs(styles.modal)}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-label={t("chrome.addWidget.title", "添加卡片")}
        >
          <ModalHeader
            title={t("chrome.addWidget.title", "添加卡片")}
            kicker={t(
              "chrome.addWidget.kicker",
              "从已安装插件中挑选一个组件，加入当前工作台分组。",
            )}
            groupLabel={t("chrome.addWidget.groupLabel", "目标分组：{{group}}", {
              group: props.activeGroupLabel ?? "我的工作台",
            })}
            closeAria={t("chrome.addWidget.closeAria", "关闭")}
            onClose={props.onClose}
          />
          <div {...stylex.attrs(styles.body)}>
            <LeftColumn
              query={query()}
              onQueryChange={setQuery}
              activeCategory={activeCategory()}
              onCategoryChange={(cat) => {
                setActiveCategory(cat)
                setSelectedIndex(0)
                setChosenSize(null)
              }}
              widgets={filteredWidgets()}
              selectedIndex={selectedIndex()}
              onSelect={handleSelect}
              renderWidgetIcon={props.renderWidgetIcon}
              t={t}
            />
            <RightColumn
              widget={selectedWidget()}
              effectiveSize={effectiveSize()}
              renderWidgetIcon={props.renderWidgetIcon}
              {...(props.renderWidgetPreview
                ? { renderWidgetPreview: props.renderWidgetPreview }
                : {})}
              onSizeChange={setChosenSize}
              onConfirm={handleConfirm}
              t={t}
            />
          </div>
          <ModalFooter
            disabled={!selectedWidget()}
            onCancel={props.onClose}
            onConfirm={handleConfirm}
            t={t}
          />
        </div>
      </div>
    </Show>
  )
}

type TFn = (key: string, fallback: string, vars?: Record<string, string | number>) => string

function ModalHeader(props: {
  title: string
  kicker: string
  groupLabel: string
  closeAria: string
  onClose: () => void
}) {
  return (
    <div {...stylex.attrs(styles.header)}>
      <div {...stylex.attrs(styles.headerTitles)}>
        <div {...stylex.attrs(styles.title)}>{props.title}</div>
        <div {...stylex.attrs(styles.kicker)}>{props.kicker}</div>
      </div>
      <div {...stylex.attrs(styles.headerContext)}>
        <span {...stylex.attrs(styles.pill)}>{props.groupLabel}</span>
        <IconButton
          size="sm"
          xstyle={styles.iconButton}
          aria-label={props.closeAria}
          onClick={props.onClose}
        >
          <X size={16} />
        </IconButton>
      </div>
    </div>
  )
}

function LeftColumn(props: {
  query: string
  onQueryChange: (value: string) => void
  activeCategory: Category | "all"
  onCategoryChange: (cat: Category | "all") => void
  widgets: Array<{ widget: AvailableWidget; category: Category }>
  selectedIndex: number
  onSelect: (index: number) => void
  renderWidgetIcon: (icon?: string) => JSX.Element
  t: TFn
}) {
  return (
    <div {...stylex.attrs(styles.left)}>
      <div {...stylex.attrs(styles.searchArea)}>
        <div {...stylex.attrs(styles.searchWrap)}>
          <span {...stylex.attrs(styles.searchIcon)} aria-hidden="true">
            <Search size={14} />
          </span>
          <Input
            type="search"
            xstyle={styles.searchInput}
            placeholder={props.t("chrome.addWidget.searchPlaceholder", "搜索卡片…")}
            aria-label={props.t("chrome.addWidget.searchPlaceholder", "搜索卡片")}
            value={props.query}
            onInput={props.onQueryChange}
          />
        </div>
      </div>
      <div {...stylex.attrs(styles.tabs)} role="tablist">
        <CategoryTab
          label={props.t("chrome.addWidget.tab.all", "全部")}
          active={props.activeCategory === "all"}
          onClick={() => props.onCategoryChange("all")}
        />
        <For each={["info", "productivity", "tools", "installed"] as const}>
          {(cat) => (
            <CategoryTab
              label={props.t(`chrome.addWidget.tab.${cat}`, CATEGORY_LABELS[cat])}
              active={props.activeCategory === cat}
              onClick={() => props.onCategoryChange(cat)}
            />
          )}
        </For>
      </div>
      <div {...stylex.attrs(styles.list)}>
        <Show
          when={props.widgets.length > 0}
          fallback={
            <div {...stylex.attrs(styles.empty)}>
              {props.t("chrome.addWidget.empty", "没有匹配的卡片")}
            </div>
          }
        >
          <For each={props.widgets}>
            {({ widget }, index) => (
              <WidgetRow
                widget={widget}
                selected={index() === props.selectedIndex}
                onSelect={() => props.onSelect(index())}
                renderWidgetIcon={props.renderWidgetIcon}
                t={props.t}
              />
            )}
          </For>
        </Show>
      </div>
    </div>
  )
}

function CategoryTab(props: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      xstyle={[styles.tab, props.active && styles.selected]}
      role="tab"
      aria-selected={props.active}
      onClick={props.onClick}
    >
      {props.label}
    </Button>
  )
}

function WidgetRow(props: {
  widget: AvailableWidget
  selected: boolean
  onSelect: () => void
  renderWidgetIcon: (icon?: string) => JSX.Element
  t: TFn
}) {
  return (
    <Button
      size="sm"
      variant="ghost"
      xstyle={[styles.item, props.selected && styles.selected]}
      aria-pressed={props.selected}
      onClick={props.onSelect}
    >
      <span {...stylex.attrs(styles.itemIcon)} data-add-widget-icon>
        {props.renderWidgetIcon(props.widget.icon)}
      </span>
      <span {...stylex.attrs(styles.itemInfo)}>
        <span {...stylex.attrs(styles.itemName)}>{props.widget.title}</span>
        <Show when={props.widget.description}>
          <span {...stylex.attrs(styles.itemDescription)}>{props.widget.description}</span>
        </Show>
      </span>
      <span {...stylex.attrs(styles.itemMeta)}>
        <span
          {...stylex.attrs(styles.source, props.widget.source === "official" && styles.selected)}
        >
          {props.widget.source === "official"
            ? props.t("chrome.addWidget.badge.official", "官方")
            : props.t("chrome.addWidget.badge.thirdParty", "第三方")}
        </span>
        <span {...stylex.attrs(styles.sizeHint)}>{defaultSize(props.widget)}</span>
      </span>
    </Button>
  )
}

function RightColumn(props: {
  widget: AvailableWidget | undefined
  effectiveSize: WidgetSize | undefined
  renderWidgetIcon: (icon?: string) => JSX.Element
  renderWidgetPreview?: (pluginId: string, widgetId: string, size: WidgetSize) => JSX.Element
  onSizeChange: (size: WidgetSize) => void
  onConfirm: () => void
  t: TFn
}) {
  return (
    <div {...stylex.attrs(styles.right)}>
      <Show
        when={props.widget}
        fallback={
          <div {...stylex.attrs(styles.previewEmpty)}>
            <span>{props.t("chrome.addWidget.previewEmpty", "请选择左侧的卡片查看预览")}</span>
          </div>
        }
      >
        {(widgetAccessor) => {
          const widget = widgetAccessor()
          return (
            <>
              <PreviewHead widget={widget} effectiveSize={props.effectiveSize} t={props.t} />
              <PreviewArea
                widget={widget}
                effectiveSize={props.effectiveSize}
                renderWidgetIcon={props.renderWidgetIcon}
                {...(props.renderWidgetPreview
                  ? { renderWidgetPreview: props.renderWidgetPreview }
                  : {})}
              />
              <div {...stylex.attrs(styles.detailRow)}>
                <SizeSelector
                  supportedSizes={widget.supportedSizes ?? SIZE_OPTIONS}
                  effectiveSize={props.effectiveSize}
                  onChange={props.onSizeChange}
                  t={props.t}
                />
                <WidgetMetaCard widget={widget} t={props.t} />
              </div>
            </>
          )
        }}
      </Show>
    </div>
  )
}

function PreviewHead(props: {
  widget: AvailableWidget
  effectiveSize: WidgetSize | undefined
  t: TFn
}) {
  return (
    <div {...stylex.attrs(styles.previewHead)}>
      <div>
        <div {...stylex.attrs(styles.previewLabel)}>
          {props.t("chrome.addWidget.previewLabel", "卡片预览")}
        </div>
        <div {...stylex.attrs(styles.previewTitle)}>{props.widget.title}</div>
      </div>
      <Show when={props.effectiveSize}>
        <div {...stylex.attrs(styles.previewStatus)}>
          {props.t("chrome.addWidget.previewStatus", "预览 · {{size}}", {
            size: props.effectiveSize as string,
          })}
        </div>
      </Show>
    </div>
  )
}

const PREVIEW_CALLBACKS: WidgetHostCallbacks = {
  onDblClick: () => {},
  onContextMenu: () => {},
  onResize: () => {},
  onRemove: () => {},
  onExpand: () => {},
  isDragging: false,
}

function PreviewArea(props: {
  widget: AvailableWidget
  effectiveSize: WidgetSize | undefined
  renderWidgetIcon: (icon?: string) => JSX.Element
  renderWidgetPreview?: (pluginId: string, widgetId: string, size: WidgetSize) => JSX.Element
}) {
  // 预览用真实的 WidgetCardShell 包真实的插件 card view：外框和工作台同一个组件，
  // 内容也是同一个 view（同一份 registry 解析），卡片样式或插件视图改动都不需要
  // 在这里同步第二份。尺寸差异由 grid span 表达。
  const previewSize = () => props.effectiveSize ?? defaultSize(props.widget)

  // 拿不到 view 时退回描述文案，至少不是空白卡片。
  const previewContent = () =>
    props.renderWidgetPreview?.(props.widget.pluginId, props.widget.id, previewSize())

  // 舞台按卡片的 span 精确定尺：单元恒为正方边长 PREVIEW_UNIT，
  // 所以 S(1x1) 是正方、M(2x1) 是 2:1、L(2x2) 正方、XL(4x2) 是 2:1，比例真实。
  const stageStyle = () => {
    const cols = widgetGridColumnSpan(previewSize())
    const rows = widgetGridRowSpan(previewSize())
    return {
      "grid-template-columns": `repeat(${cols}, ${PREVIEW_UNIT}px)`,
      "grid-template-rows": `repeat(${rows}, ${PREVIEW_UNIT}px)`,
    }
  }

  return (
    <div {...stylex.attrs(styles.previewArea)}>
      <div {...stylex.attrs(styles.previewStage)} style={stageStyle()} data-add-widget-preview-grid>
        {/* WidgetCardShell 的 grid span 在挂载时定型（见 WidgetCardShell gridItemProps），
            真实工作台靠 <For> 换实例引用重挂载来刷新；预览是单一常驻实例，尺寸变化不重挂
            就会让卡片仍按旧 span 占位、填不满新舞台。用 keyed 让尺寸变化重建卡片，行为对齐工作台。 */}
        <Show when={previewSize()} keyed>
          {(size) => (
            <WidgetCardShell
              instance={{
                id: "add-widget-preview",
                workspaceId: "add-widget-preview",
                pluginId: props.widget.pluginId,
                contributionId: props.widget.id,
                extensionPoint: "widget",
                regionId: "preview",
                enabled: true,
                size,
                config: {},
                createdAt: "",
                updatedAt: "",
              }}
              title={props.widget.title}
              icon={props.renderWidgetIcon(props.widget.icon)}
              supportedSizes={props.widget.supportedSizes ?? [size]}
              currentSize={size}
              callbacks={PREVIEW_CALLBACKS}
              preview
            >
              <Show
                when={previewContent()}
                fallback={
                  <div {...stylex.attrs(styles.previewWidgetBody)}>
                    <Show
                      when={props.widget.description}
                      fallback={<span>{props.widget.title}</span>}
                    >
                      {props.widget.description}
                    </Show>
                  </div>
                }
              >
                {previewContent()}
              </Show>
            </WidgetCardShell>
          )}
        </Show>
      </div>
    </div>
  )
}

function SizeSelector(props: {
  supportedSizes: WidgetSize[]
  effectiveSize: WidgetSize | undefined
  onChange: (size: WidgetSize) => void
  t: TFn
}): JSX.Element {
  return (
    <div {...stylex.attrs(styles.box)}>
      <div {...stylex.attrs(styles.sizeLabel)}>
        <div {...stylex.attrs(styles.boxTitle)}>
          {props.t("chrome.addWidget.size.title", "尺寸")}
        </div>
        <div {...stylex.attrs(styles.boxDescription)}>
          {props.t("chrome.addWidget.size.desc", "选择卡片在当前分组里的默认占位。")}
        </div>
      </div>
      <div {...stylex.attrs(styles.sizeOptions)} role="radiogroup">
        <For each={SIZE_OPTIONS}>
          {(size) => {
            const disabled = () => !props.supportedSizes.includes(size)
            const active = () => props.effectiveSize === size
            return (
              <Button
                size="sm"
                variant="ghost"
                xstyle={[styles.sizeButton, active() && styles.selected]}
                role="radio"
                aria-checked={active()}
                disabled={disabled()}
                onClick={() => props.onChange(size)}
              >
                {size}
              </Button>
            )
          }}
        </For>
      </div>
    </div>
  )
}

function WidgetMetaCard(props: { widget: AvailableWidget; t: TFn }) {
  return (
    <div {...stylex.attrs(styles.box, styles.metaCard)}>
      <div {...stylex.attrs(styles.boxTitle)}>{props.t("chrome.addWidget.meta.title", "信息")}</div>
      <div {...stylex.attrs(styles.metaRow)}>
        <span>{props.t("chrome.addWidget.meta.source", "来源")}</span>
        <strong {...stylex.attrs(styles.metaValue)}>
          {props.widget.source === "official"
            ? props.t("chrome.addWidget.source.official", "官方插件")
            : props.t("chrome.addWidget.source.thirdParty", "第三方插件")}
        </strong>
      </div>
      <Show when={props.widget.version}>
        <div {...stylex.attrs(styles.metaRow)}>
          <span>{props.t("chrome.addWidget.meta.version", "版本")}</span>
          <strong {...stylex.attrs(styles.metaValue)}>v{props.widget.version}</strong>
        </div>
      </Show>
      <Show when={props.widget.supportedSizes && props.widget.supportedSizes.length > 0}>
        <div {...stylex.attrs(styles.metaRow)}>
          <span>{props.t("chrome.addWidget.meta.support", "支持")}</span>
          <strong {...stylex.attrs(styles.metaValue)}>
            {props.widget.supportedSizes!.join(" / ")}
          </strong>
        </div>
      </Show>
    </div>
  )
}

function ModalFooter(props: {
  disabled: boolean
  onCancel: () => void
  onConfirm: () => void
  t: TFn
}) {
  return (
    <div {...stylex.attrs(styles.footer)} data-workbench-overlay-footer>
      <div {...stylex.attrs(styles.footerActions)}>
        <Button size="sm" variant="secondary" onClick={props.onCancel}>
          {props.t("chrome.addWidget.cancel", "取消")}
        </Button>
        <Button size="sm" variant="primary" disabled={props.disabled} onClick={props.onConfirm}>
          {props.t("chrome.addWidget.confirm", "添加到工作台")}
        </Button>
      </div>
    </div>
  )
}
