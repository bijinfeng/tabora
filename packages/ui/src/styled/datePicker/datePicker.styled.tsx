import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"
import type { JSX } from "solid-js"
import { ChevronLeft, ChevronRight } from "lucide-solid"
import { For } from "solid-js"

import { joinClassNames } from "../../stylex"

export type DatePickerProps = {
  value?: string
  onChange?: (dateStr: string) => void
  year: number
  month: number
  onMonthChange?: (year: number, month: number) => void
  markedDates?: string[]
  today?: string
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  xstyle?: StyleXStyles
}

type CalendarDay = { day: number; dateStr: string }

function buildDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: CalendarDay[] = []
  for (let i = 0; i < firstDay; i++) {
    days.push({ day: 0, dateStr: "" })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    days.push({ day: d, dateStr: date.toISOString().slice(0, 10) })
  }
  return days
}

const DAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"]

function formatMonthLabel(year: number, month: number): string {
  return `${year}年${month + 1}月`
}

const styles = stylex.create({
  root: {
    fontFamily: "inherit",
  },
  header: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "var(--tbr-space-2)",
  },
  label: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 12,
    fontWeight: 600,
  },
  nav: {
    display: "flex",
    gap: 2,
  },
  navButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: "var(--tbr-radius-2)",
    color: "rgb(var(--tbr-color-text-subtle))",
    cursor: "pointer",
    display: "flex",
    height: 24,
    justifyContent: "center",
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "background-color, color",
    transitionTimingFunction: "var(--tbr-ease)",
    width: 24,
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
      color: "rgb(var(--tbr-color-text))",
    },
    ":focus-visible": {
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: 2,
    },
  },
  grid: {
    display: "grid",
    gap: 1,
    gridTemplateColumns: "repeat(7, 1fr)",
    textAlign: "center",
  },
  dow: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 10,
    fontWeight: 600,
    lineHeight: 1,
    paddingBlock: 2,
    paddingInline: 0,
  },
  dayBase: {
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: "var(--tbr-radius-pill)",
    fontFamily: "inherit",
    fontSize: 11,
    lineHeight: "24px",
    minHeight: 24,
    padding: 0,
  },
  day: {
    backgroundColor: "transparent",
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "pointer",
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "background-color, color",
    transitionTimingFunction: "var(--tbr-ease)",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
    },
    ":focus-visible": {
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: 1,
    },
  },
  emptyDay: {
    backgroundColor: "transparent",
    cursor: "default",
  },
  today: {
    backgroundColor: "rgb(var(--tbr-color-accent))",
    color: "rgb(var(--tbr-color-inverse))",
    fontWeight: 700,
  },
  active: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    color: "rgb(var(--tbr-color-accent))",
    fontWeight: 600,
  },
  marked: {
    position: "relative",
    "::after": {
      backgroundColor: "rgb(var(--tbr-color-accent))",
      borderRadius: "50%",
      bottom: 2,
      content: '""',
      height: 3,
      left: "50%",
      position: "absolute",
      transform: "translateX(-50%)",
      width: 3,
    },
  },
  todayMarked: {
    "::after": {
      backgroundColor: "rgb(var(--tbr-color-inverse))",
    },
  },
})

export function DatePicker(props: DatePickerProps) {
  const days = () => buildDays(props.year, props.month)
  const todayStr = props.today ?? new Date().toISOString().slice(0, 10)
  const markedSet = () => new Set(props.markedDates ?? [])

  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const headerCompiled = () => stylex.attrs(styles.header)
  const labelCompiled = () => stylex.attrs(styles.label)
  const navCompiled = () => stylex.attrs(styles.nav)
  const navButtonCompiled = () => stylex.attrs(styles.navButton)
  const gridCompiled = () => stylex.attrs(styles.grid)
  const dowCompiled = () => stylex.attrs(styles.dow)
  const emptyDayCompiled = () => stylex.attrs(styles.dayBase, styles.emptyDay)
  const dayBaseCompiled = () => stylex.attrs(styles.dayBase, styles.day)
  const todayCompiled = () => stylex.attrs(styles.today)
  const activeCompiled = () => stylex.attrs(styles.active)
  const markedCompiled = () => stylex.attrs(styles.marked)
  const todayMarkedCompiled = () => stylex.attrs(styles.todayMarked)

  function setMonth(delta: number) {
    const d = new Date(props.year, props.month + delta, 1)
    props.onMonthChange?.(d.getFullYear(), d.getMonth())
  }

  function selectDay(dateStr: string) {
    if (!dateStr) return
    props.onChange?.(dateStr)
  }

  return (
    <div class={joinClassNames(rootCompiled().class, props.class)} style={props.style}>
      <div class={headerCompiled().class} style={props.style}>
        <span class={labelCompiled().class} style={props.style}>
          {formatMonthLabel(props.year, props.month)}
        </span>
        <div class={navCompiled().class} style={props.style}>
          <button
            class={navButtonCompiled().class}
            style={props.style}
            type="button"
            aria-label="上个月"
            onClick={() => setMonth(-1)}
          >
            <ChevronLeft size={12} />
          </button>
          <button
            class={navButtonCompiled().class}
            style={props.style}
            type="button"
            aria-label="下个月"
            onClick={() => setMonth(1)}
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
      <div class={gridCompiled().class} style={props.style}>
        <For each={DAY_NAMES}>
          {(name) => (
            <div class={dowCompiled().class} style={props.style}>
              {name}
            </div>
          )}
        </For>
        <For each={days()}>
          {(d) => {
            if (!d.dateStr) {
              return <span class={emptyDayCompiled().class} style={props.style} />
            }
            const isToday = d.dateStr === todayStr
            const isActive = d.dateStr === props.value
            const isMarked = markedSet().has(d.dateStr)
            return (
              <button
                class={joinClassNames(
                  dayBaseCompiled().class,
                  isActive && !isToday && activeCompiled().class,
                  isToday && todayCompiled().class,
                  isMarked && markedCompiled().class,
                  isToday && isMarked && todayMarkedCompiled().class,
                )}
                style={{}}
                type="button"
                aria-label={`${props.year}年${props.month + 1}月${d.day}日`}
                aria-pressed={isActive}
                onClick={() => selectDay(d.dateStr)}
              >
                {d.day}
              </button>
            )
          }}
        </For>
      </div>
    </div>
  )
}
