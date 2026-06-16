import { ChevronLeft, ChevronRight } from "lucide-solid"
import { For } from "solid-js"
import "./styles.css"

export type DatePickerProps = {
  value?: string
  onChange?: (dateStr: string) => void
  year: number
  month: number
  onMonthChange?: (year: number, month: number) => void
  markedDates?: string[]
  today?: string
  class?: string
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

export function DatePicker(props: DatePickerProps) {
  const days = () => buildDays(props.year, props.month)
  const todayStr = props.today ?? new Date().toISOString().slice(0, 10)
  const markedSet = () => new Set(props.markedDates ?? [])

  function setMonth(delta: number) {
    const d = new Date(props.year, props.month + delta, 1)
    props.onMonthChange?.(d.getFullYear(), d.getMonth())
  }

  function selectDay(dateStr: string) {
    if (!dateStr) return
    props.onChange?.(dateStr)
  }

  return (
    <div class="tbr-date-picker" classList={{ [props.class ?? ""]: !!props.class }}>
      <div class="tbr-date-picker-header">
        <span class="tbr-date-picker-label">{formatMonthLabel(props.year, props.month)}</span>
        <div class="tbr-date-picker-nav">
          <button
            class="tbr-date-picker-nav-btn"
            type="button"
            aria-label="上个月"
            onClick={() => setMonth(-1)}
          >
            <ChevronLeft size={12} />
          </button>
          <button
            class="tbr-date-picker-nav-btn"
            type="button"
            aria-label="下个月"
            onClick={() => setMonth(1)}
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
      <div class="tbr-date-picker-grid">
        <For each={DAY_NAMES}>{(name) => <div class="tbr-date-picker-dow">{name}</div>}</For>
        <For each={days()}>
          {(d) => {
            if (!d.dateStr) {
              return <span class="tbr-date-picker-day is-empty" />
            }
            const isToday = d.dateStr === todayStr
            const isActive = d.dateStr === props.value
            const isMarked = markedSet().has(d.dateStr)
            return (
              <button
                class="tbr-date-picker-day"
                classList={{
                  "is-today": isToday,
                  "is-active": isActive,
                  "is-marked": isMarked,
                }}
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
