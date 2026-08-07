import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, For, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import { Skeleton } from "@tabora/ui/skeleton"
import ArrowRight from "lucide-solid/icons/arrow-right"
import Check from "lucide-solid/icons/check"
import Plus from "lucide-solid/icons/plus"
import { DEFAULT_GROUP_ID, TODO_ITEMS_KEY, type TodoItem } from "./todo-data"
import { styles } from "./styles"

const MONTH_LABELS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
]
const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

const SEED_ITEMS: TodoItem[] = [
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
  },
  {
    id: "seed-3",
    text: "清理插件设置中的导入导出项",
    done: false,
    priority: "low",
    groupId: DEFAULT_GROUP_ID,
  },
]

function formatDate(iso?: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function todayLabel(): string {
  const d = new Date()
  return `${MONTH_LABELS[d.getMonth()]} ${d.getDate()} · ${WEEKDAY_LABELS[d.getDay()]}`
}

/** 时间轴左列与看板右下角的时间标签：有截止日期就用它，否则留占位。 */
function dueLabel(item: TodoItem): string {
  return item.dueDate ? formatDate(item.dueDate) : "待定"
}

function statusTag(item: TodoItem): string {
  if (item.done) return "完成"
  if (item.priority === "high") return "重要"
  return "计划"
}

export function TodoCard(props: WidgetViewProps) {
  const [items, setItems] = createSignal<TodoItem[]>([])
  const [loading, setLoading] = createSignal(true)

  void props.data.get<TodoItem[]>(TODO_ITEMS_KEY).then((saved) => {
    // 保存过空数组也算用户意图，只在从未保存时才铺种子数据
    if (saved !== null && saved !== undefined) setItems(saved)
    else setItems(SEED_ITEMS)
    setLoading(false)
  })

  async function toggleItem(id: string) {
    const next = items().map((i) => (i.id === id ? { ...i, done: !i.done } : i))
    setItems(next)
    await props.data.save(TODO_ITEMS_KEY, next)
  }

  const cardSize = () => props.size ?? "S"
  const openItems = createMemo(() => items().filter((i) => !i.done))
  const doneCount = createMemo(() => items().length - openItems().length)
  const progress = createMemo(() => Math.round((doneCount() / Math.max(items().length, 1)) * 100))
  const nextItem = createMemo(() => openItems()[0])
  const isEmpty = () => items().length === 0

  const openExpand = () => props.host.openExpand()

  // 时间轴取前三条，看板分「今天 / 稍后」各两条，跟设计稿的信息密度一致
  const timelineItems = createMemo(() => items().slice(0, 3))
  const todayItems = createMemo(() => items().slice(0, 2))
  const laterItems = createMemo(() => items().slice(2, 4))

  return (
    <div {...stylex.attrs(styles.card)} data-todo-card data-todo-variant={cardSize()}>
      <Show when={cardSize() === "S"}>
        <div {...stylex.attrs(styles.small)} aria-label="待办">
          <div {...stylex.attrs(styles.smallHead)}>
            <span>待办</span>
            <span {...stylex.attrs(styles.mono)}>
              {doneCount()}/{items().length}
            </span>
          </div>
          <SmallRing empty={isEmpty()} progress={progress()} />
          <div {...stylex.attrs(styles.smallNext)}>
            <Show when={!isEmpty()} fallback="点击添加第一项待办">
              下一项 · {nextItem()?.text ?? "全部完成"}
            </Show>
          </div>
        </div>
      </Show>

      <Show when={cardSize() === "M"}>
        <div {...stylex.attrs(styles.medium)}>
          <div {...stylex.attrs(styles.nextHead)}>
            <span>Next task</span>
            <strong {...stylex.attrs(styles.nextHeadCount)}>
              {doneCount()}/{items().length}
            </strong>
          </div>
          <Show when={!loading()} fallback={<Skeleton height="30px" width="100%" />}>
            <Show
              when={nextItem()}
              fallback={<NextTaskEmpty empty={isEmpty()} onClick={openExpand} />}
            >
              {(item) => (
                <button
                  {...stylex.attrs(styles.hit, styles.nextTask)}
                  type="button"
                  onClick={() => void toggleItem(item().id)}
                >
                  <span {...stylex.attrs(styles.check)} aria-hidden="true" />
                  <span {...stylex.attrs(styles.nextCopy)}>
                    <strong {...stylex.attrs(styles.nextTitle)}>{item().text}</strong>
                    <span {...stylex.attrs(styles.nextMeta)}>{dueLabel(item())} · 点击完成</span>
                  </span>
                  <span {...stylex.attrs(styles.nextArrow)} aria-hidden="true">
                    <ArrowRight size={14} />
                  </span>
                </button>
              )}
            </Show>
          </Show>
          <div {...stylex.attrs(styles.nextProgress)}>
            <i {...stylex.attrs(styles.nextProgressFill)} style={{ width: `${progress()}%` }} />
          </div>
        </div>
      </Show>

      <Show when={cardSize() === "L"}>
        <div {...stylex.attrs(styles.large)}>
          <div {...stylex.attrs(styles.timelineHead)}>
            <div {...stylex.attrs(styles.timelineTitle)}>
              <span {...stylex.attrs(styles.timelineKicker)}>{todayLabel()}</span>
              <strong {...stylex.attrs(styles.timelineHeading)}>今日计划</strong>
            </div>
            <TimelineRing empty={isEmpty()} progress={progress()} />
          </div>
          <div {...stylex.attrs(styles.timelineList)}>
            <Show when={!loading()} fallback={<Skeleton height="84px" width="100%" />}>
              <Show
                when={!isEmpty()}
                fallback={
                  <button
                    {...stylex.attrs(styles.hit, styles.timelineEmpty)}
                    type="button"
                    onClick={openExpand}
                  >
                    <strong>添加今天的第一项任务</strong>
                    <span {...stylex.attrs(styles.timelineEmptyPlus)}>
                      <Plus size={14} />
                    </span>
                  </button>
                }
              >
                <span {...stylex.attrs(styles.timelineAxis)} aria-hidden="true" />
                <For each={timelineItems()}>
                  {(item) => <TimelineRow item={item} onToggle={(id) => void toggleItem(id)} />}
                </For>
              </Show>
            </Show>
          </div>
          <div {...stylex.attrs(styles.timelineFoot)}>
            <span {...stylex.attrs(styles.timelineFootLead)}>{openItems().length} 项待处理</span>
            <span {...stylex.attrs(styles.timelineFootTail)}>
              {isEmpty() ? "尚未创建任务" : "双击展开"}
            </span>
          </div>
        </div>
      </Show>

      <Show when={cardSize() === "XL"}>
        <div {...stylex.attrs(styles.extraLarge)}>
          <div {...stylex.attrs(styles.boardHead)}>
            <div {...stylex.attrs(styles.boardTitle)}>
              <strong {...stylex.attrs(styles.boardHeading)}>任务看板</strong>
              <span {...stylex.attrs(styles.boardKicker)}>PERSONAL WORKFLOW</span>
            </div>
            <div {...stylex.attrs(styles.boardSummary)}>
              <span {...stylex.attrs(styles.boardChip)}>{openItems().length} 待处理</span>
              <span {...stylex.attrs(styles.boardChip)}>{doneCount()} 已完成</span>
            </div>
          </div>
          <div {...stylex.attrs(styles.boardColumns)}>
            <section {...stylex.attrs(styles.boardColumn)}>
              <div {...stylex.attrs(styles.boardColumnHead)}>
                <span>今天</span>
                <span>{todayItems().length}</span>
              </div>
              <div {...stylex.attrs(styles.boardStack)}>
                <Show when={!loading()} fallback={<Skeleton height="42px" width="100%" />}>
                  <Show
                    when={todayItems().length > 0}
                    fallback={
                      <button
                        {...stylex.attrs(styles.hit, styles.boardEmpty, styles.boardEmptyAction)}
                        type="button"
                        onClick={openExpand}
                      >
                        <Plus size={14} /> 添加今天的任务
                      </button>
                    }
                  >
                    <For each={todayItems()}>
                      {(item) => <BoardTask item={item} onToggle={(id) => void toggleItem(id)} />}
                    </For>
                  </Show>
                </Show>
              </div>
            </section>
            <section {...stylex.attrs(styles.boardColumn)}>
              <div {...stylex.attrs(styles.boardColumnHead)}>
                <span>稍后</span>
                <span>{laterItems().length}</span>
              </div>
              <div {...stylex.attrs(styles.boardStack)}>
                <Show when={!loading()} fallback={<Skeleton height="42px" width="100%" />}>
                  <Show
                    when={laterItems().length > 0}
                    fallback={<div {...stylex.attrs(styles.boardEmpty)}>暂无任务</div>}
                  >
                    <For each={laterItems()}>
                      {(item) => <BoardTask item={item} onToggle={(id) => void toggleItem(id)} />}
                    </For>
                  </Show>
                </Show>
              </div>
            </section>
          </div>
        </div>
      </Show>
    </div>
  )
}

function TimelineRing(props: { empty: boolean; progress: number }) {
  return (
    <div
      {...stylex.attrs(styles.timelineRing, props.empty && styles.timelineRingEmpty)}
      style={{ "--todo-progress": `${props.progress}%` }}
      aria-hidden="true"
    >
      <strong {...stylex.attrs(styles.timelineRingValue)}>{props.progress}%</strong>
    </div>
  )
}

function TimelineRow(props: { item: TodoItem; onToggle: (id: string) => void }) {
  return (
    <button
      {...stylex.attrs(styles.hit, styles.timelineRow)}
      type="button"
      onClick={() => props.onToggle(props.item.id)}
    >
      <span {...stylex.attrs(styles.timelineTime)}>{dueLabel(props.item)}</span>
      <span
        {...stylex.attrs(styles.timelineNode, props.item.done && styles.timelineNodeDone)}
        aria-hidden="true"
      />
      <strong {...stylex.attrs(styles.timelineText, props.item.done && styles.timelineTextDone)}>
        {props.item.text}
      </strong>
      <span {...stylex.attrs(styles.timelineTag)}>{statusTag(props.item)}</span>
    </button>
  )
}

// 无任务与全部完成两种空态：前者虚线待创建，后者实心已勾选
function NextTaskEmpty(props: { empty: boolean; onClick: () => void }) {
  return (
    <button
      {...stylex.attrs(styles.hit, styles.nextTask, props.empty && styles.nextTaskEmpty)}
      type="button"
      onClick={props.onClick}
    >
      <span {...stylex.attrs(styles.check, !props.empty && styles.checkDone)} aria-hidden="true" />
      <span {...stylex.attrs(styles.nextCopy)}>
        <strong {...stylex.attrs(styles.nextTitle)}>
          {props.empty ? "添加第一项待办" : "今天的任务已完成"}
        </strong>
        <span {...stylex.attrs(styles.nextMeta)}>
          {props.empty ? "今天 · 点击创建" : "可以休息一下"}
        </span>
      </span>
      <span {...stylex.attrs(styles.nextArrow)} aria-hidden="true">
        {props.empty ? <Plus size={14} /> : <Check size={14} />}
      </span>
    </button>
  )
}

// stylex 的 babel 插件只能静态求值 props/参数，signal 调用要先落成布尔 prop
function SmallRing(props: { empty: boolean; progress: number }) {
  return (
    <div
      {...stylex.attrs(styles.smallRing, props.empty && styles.smallRingEmpty)}
      aria-hidden="true"
    >
      <span {...stylex.attrs(styles.smallRingValue, styles.mono)}>{props.progress}%</span>
    </div>
  )
}

function BoardTask(props: { item: TodoItem; onToggle: (id: string) => void }) {
  return (
    <button
      {...stylex.attrs(styles.hit, styles.boardTask)}
      type="button"
      onClick={() => props.onToggle(props.item.id)}
    >
      <span
        {...stylex.attrs(styles.check, props.item.done && styles.checkDone)}
        aria-hidden="true"
      />
      <strong {...stylex.attrs(styles.boardTaskText, props.item.done && styles.boardTaskTextDone)}>
        {props.item.text}
      </strong>
      <em {...stylex.attrs(styles.boardTaskDue)}>{dueLabel(props.item)}</em>
    </button>
  )
}
