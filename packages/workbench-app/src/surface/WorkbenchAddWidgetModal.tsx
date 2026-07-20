import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { WidgetSize } from "@tabora/plugin-api"
import { Search, X } from "lucide-solid"

import type { ShellTranslation } from "../i18n"
import type { AvailableWidget } from "./WorkbenchShellChrome.types"
import { styles } from "./WorkbenchAddWidgetModal.styles"

type Category = "recommended" | "info" | "productivity" | "tools" | "installed"

const CATEGORY_LABELS: Record<Category, string> = {
  recommended: "推荐",
  info: "信息",
  productivity: "生产力",
  tools: "工具",
  installed: "已安装",
}

const SIZE_OPTIONS: WidgetSize[] = ["S", "M", "L", "XL"]

// 推荐分组里的排序优先级——越靠前展示越早。可根据数据补充。
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

function bucketCategory(widget: AvailableWidget): Category {
  const id = `${widget.pluginId}.${widget.id}`.toLowerCase()
  if (/weather|news|stock|info/.test(id)) return "info"
  if (/todo|notes|today|focus|task/.test(id)) return "productivity"
  if (/quick-link|links|launcher|tool/.test(id)) return "tools"
  return "recommended"
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
  widgetIconLabel: (icon?: string) => string
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

  return (
    <Show when={props.open}>
      <div
        {...stylex.props(styles.overlay)}
        data-workbench-overlay="add-widget"
        onClick={props.onClose}
        onKeyDown={handleOverlayKeyDown}
        tabIndex={-1}
      >
        <div
          {...stylex.props(styles.modal)}
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
          <div {...stylex.props(styles.body)}>
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
              widgetIconLabel={props.widgetIconLabel}
              t={t}
            />
            <RightColumn
              widget={selectedWidget()}
              effectiveSize={effectiveSize()}
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
    <div {...stylex.props(styles.header)}>
      <div {...stylex.props(styles.headerTitles)}>
        <div {...stylex.props(styles.title)}>{props.title}</div>
        <div {...stylex.props(styles.kicker)}>{props.kicker}</div>
      </div>
      <div {...stylex.props(styles.headerContext)}>
        <span {...stylex.props(styles.pill)}>{props.groupLabel}</span>
        <button
          type="button"
          {...stylex.props(styles.iconButton)}
          aria-label={props.closeAria}
          onClick={props.onClose}
        >
          <X size={16} />
        </button>
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
  widgetIconLabel: (icon?: string) => string
  t: TFn
}) {
  return (
    <div {...stylex.props(styles.left)}>
      <div {...stylex.props(styles.searchArea)}>
        <div {...stylex.props(styles.searchWrap)}>
          <span {...stylex.props(styles.searchIcon)} aria-hidden="true">
            <Search size={14} />
          </span>
          <input
            type="search"
            {...stylex.props(styles.searchInput)}
            placeholder={props.t("chrome.addWidget.searchPlaceholder", "搜索卡片…")}
            aria-label={props.t("chrome.addWidget.searchPlaceholder", "搜索卡片")}
            value={props.query}
            onInput={(event) => props.onQueryChange(event.currentTarget.value)}
          />
        </div>
      </div>
      <div {...stylex.props(styles.tabs)} role="tablist">
        <CategoryTab
          label={props.t("chrome.addWidget.tab.recommended", "推荐")}
          active={props.activeCategory === "all" || props.activeCategory === "recommended"}
          onClick={() => props.onCategoryChange("recommended")}
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
      <div {...stylex.props(styles.list)}>
        <Show
          when={props.widgets.length > 0}
          fallback={
            <div {...stylex.props(styles.empty)}>
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
                widgetIconLabel={props.widgetIconLabel}
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
    <button
      type="button"
      {...stylex.props(styles.tab, props.active && styles.selected)}
      role="tab"
      aria-selected={props.active}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  )
}

function WidgetRow(props: {
  widget: AvailableWidget
  selected: boolean
  onSelect: () => void
  widgetIconLabel: (icon?: string) => string
  t: TFn
}) {
  return (
    <button
      type="button"
      {...stylex.props(styles.item, props.selected && styles.selected)}
      aria-pressed={props.selected}
      onClick={props.onSelect}
    >
      <span {...stylex.props(styles.itemIcon)}>{props.widgetIconLabel(props.widget.icon)}</span>
      <span {...stylex.props(styles.itemInfo)}>
        <span {...stylex.props(styles.itemName)}>{props.widget.title}</span>
        <Show when={props.widget.description}>
          <span {...stylex.props(styles.itemDescription)}>{props.widget.description}</span>
        </Show>
      </span>
      <span {...stylex.props(styles.itemMeta)}>
        <span
          {...stylex.props(styles.source, props.widget.source === "official" && styles.selected)}
        >
          {props.widget.source === "official"
            ? props.t("chrome.addWidget.badge.official", "官方")
            : props.t("chrome.addWidget.badge.thirdParty", "第三方")}
        </span>
        <span {...stylex.props(styles.sizeHint)}>{defaultSize(props.widget)}</span>
      </span>
    </button>
  )
}

function RightColumn(props: {
  widget: AvailableWidget | undefined
  effectiveSize: WidgetSize | undefined
  onSizeChange: (size: WidgetSize) => void
  onConfirm: () => void
  t: TFn
}) {
  return (
    <div {...stylex.props(styles.right)}>
      <Show
        when={props.widget}
        fallback={
          <div {...stylex.props(styles.previewEmpty)}>
            <span>{props.t("chrome.addWidget.previewEmpty", "请选择左侧的卡片查看预览")}</span>
          </div>
        }
      >
        {(widgetAccessor) => {
          const widget = widgetAccessor()
          return (
            <>
              <PreviewHead widget={widget} effectiveSize={props.effectiveSize} t={props.t} />
              <PreviewArea widget={widget} effectiveSize={props.effectiveSize} t={props.t} />
              <div {...stylex.props(styles.detailRow)}>
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
    <div {...stylex.props(styles.previewHead)}>
      <div>
        <div {...stylex.props(styles.previewLabel)}>
          {props.t("chrome.addWidget.previewLabel", "卡片预览")}
        </div>
        <div {...stylex.props(styles.previewTitle)}>{props.widget.title}</div>
      </div>
      <Show when={props.effectiveSize}>
        <div {...stylex.props(styles.previewStatus)}>
          {props.t("chrome.addWidget.previewStatus", "预览 · {{size}}", {
            size: props.effectiveSize as string,
          })}
        </div>
      </Show>
    </div>
  )
}

function PreviewArea(props: {
  widget: AvailableWidget
  effectiveSize: WidgetSize | undefined
  t: TFn
}) {
  return (
    <div {...stylex.props(styles.previewArea)}>
      <div {...stylex.props(styles.workspacePreview)}>
        <div {...stylex.props(styles.workspaceBar)}>
          <span {...stylex.props(styles.workspaceGroup)}>
            <span {...stylex.props(styles.dot)} />
            {props.t("chrome.addWidget.workspaceBar.todayGroup", "今日")}
          </span>
          <span>{props.t("chrome.addWidget.workspaceBar.placement", "添加后放到分组末尾")}</span>
        </div>
        <div {...stylex.props(styles.workspaceGrid)}>
          <div
            {...stylex.props(
              styles.previewWidget,
              props.effectiveSize === "S" && styles.previewS,
              props.effectiveSize === "L" && styles.previewL,
              props.effectiveSize === "XL" && styles.previewXL,
            )}
          >
            <div {...stylex.props(styles.previewWidgetHead)}>
              <span {...stylex.props(styles.previewWidgetTitle)}>{props.widget.title}</span>
              <span
                {...stylex.props(
                  styles.badge,
                  props.widget.source !== "official" && styles.thirdParty,
                )}
              >
                {props.widget.source === "official"
                  ? props.t("chrome.addWidget.badge.official", "官方")
                  : props.t("chrome.addWidget.badge.thirdParty", "第三方")}
              </span>
            </div>
            <div {...stylex.props(styles.previewWidgetBody)}>
              <Show when={props.widget.description} fallback={<span>{props.widget.title}</span>}>
                {props.widget.description}
              </Show>
            </div>
          </div>
        </div>
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
    <div {...stylex.props(styles.box)}>
      <div {...stylex.props(styles.sizeLabel)}>
        <div {...stylex.props(styles.boxTitle)}>
          {props.t("chrome.addWidget.size.title", "尺寸")}
        </div>
        <div {...stylex.props(styles.boxDescription)}>
          {props.t("chrome.addWidget.size.desc", "选择卡片在当前分组里的默认占位。")}
        </div>
      </div>
      <div {...stylex.props(styles.sizeOptions)} role="radiogroup">
        <For each={SIZE_OPTIONS}>
          {(size) => {
            const disabled = () => !props.supportedSizes.includes(size)
            const active = () => props.effectiveSize === size
            return (
              <button
                type="button"
                {...stylex.props(styles.sizeButton, active() && styles.selected)}
                role="radio"
                aria-checked={active()}
                disabled={disabled()}
                onClick={() => props.onChange(size)}
              >
                {size}
              </button>
            )
          }}
        </For>
      </div>
    </div>
  )
}

function WidgetMetaCard(props: { widget: AvailableWidget; t: TFn }) {
  return (
    <div {...stylex.props(styles.box, styles.metaCard)}>
      <div {...stylex.props(styles.boxTitle)}>{props.t("chrome.addWidget.meta.title", "信息")}</div>
      <div {...stylex.props(styles.metaRow)}>
        <span>{props.t("chrome.addWidget.meta.source", "来源")}</span>
        <strong {...stylex.props(styles.metaValue)}>
          {props.widget.source === "official"
            ? props.t("chrome.addWidget.source.official", "官方插件")
            : props.t("chrome.addWidget.source.thirdParty", "第三方插件")}
        </strong>
      </div>
      <Show when={props.widget.version}>
        <div {...stylex.props(styles.metaRow)}>
          <span>{props.t("chrome.addWidget.meta.version", "版本")}</span>
          <strong {...stylex.props(styles.metaValue)}>v{props.widget.version}</strong>
        </div>
      </Show>
      <Show when={props.widget.supportedSizes && props.widget.supportedSizes.length > 0}>
        <div {...stylex.props(styles.metaRow)}>
          <span>{props.t("chrome.addWidget.meta.support", "支持")}</span>
          <strong {...stylex.props(styles.metaValue)}>
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
    <div {...stylex.props(styles.footer)} data-workbench-overlay-footer>
      <div {...stylex.props(styles.footerLeft)}>
        <a {...stylex.props(styles.marketplace)} href="#" onClick={(e) => e.preventDefault()}>
          {props.t("chrome.addWidget.marketplace", "浏览插件市场")}
        </a>
        <span {...stylex.props(styles.divider)} />
        <span {...stylex.props(styles.footerHint)}>
          {props.t("chrome.addWidget.shortcutHint", "Enter 添加 · Esc 关闭")}
        </span>
      </div>
      <div {...stylex.props(styles.footerActions)}>
        <button
          type="button"
          {...stylex.props(styles.button, styles.buttonSubtle)}
          onClick={props.onCancel}
        >
          {props.t("chrome.addWidget.cancel", "取消")}
        </button>
        <button
          type="button"
          {...stylex.props(styles.button)}
          disabled={props.disabled}
          onClick={(e) => e.preventDefault()}
        >
          {props.t("chrome.addWidget.details", "查看详情")}
        </button>
        <button
          type="button"
          {...stylex.props(styles.button, styles.buttonPrimary)}
          disabled={props.disabled}
          onClick={props.onConfirm}
        >
          {props.t("chrome.addWidget.confirm", "添加到工作台")}
        </button>
      </div>
    </div>
  )
}
