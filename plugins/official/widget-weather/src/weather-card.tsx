import * as stylex from "@stylexjs/stylex"
import { For, Show } from "solid-js"
import type { PluginNetworkAccess, WidgetSize, WidgetViewProps } from "@tabora/plugin-api/sdk"
import { Button } from "@tabora/ui/button"
import { InlineError } from "@tabora/ui/inline-error"
import { Skeleton } from "@tabora/ui/skeleton"
import RefreshCw from "lucide-solid/icons/refresh-cw"
import { createWeatherStore } from "./weather-store"
import {
  aqiGrade,
  aqiLabel,
  formatUpdatedAt,
  weatherCodeToText,
  windDirectionLabel,
  type WeatherSnapshot,
} from "./weather-data"
import { styles } from "./styles"

// 每个尺寸展示的逐小时数量，对齐设计稿：M 3 项、L 5 项、XL 6 项
const HOUR_COUNT: Record<WidgetSize, number> = { S: 0, M: 3, L: 5, XL: 6 }

function locationLabel(snap: WeatherSnapshot): string {
  return snap.district ? `${snap.city} · ${snap.district}` : snap.city
}

// M 的实况列约 90px、XL 左栏 112px，都放不下「城市 · 区」，
// 设计稿在这两处只留城市名；XL 的区名由下方注释行补齐
function shortLocationLabel(snap: WeatherSnapshot): string {
  return snap.city
}

// 逐小时标签：首项为「现在」，其余按设计稿用「H时」而非 HH:MM
function hourLabel(hour: WeatherSnapshot["hours"][number], index: number): string {
  if (index === 0) return "现在"
  const hh = Number.parseInt(hour.time.slice(0, 2), 10)
  return Number.isNaN(hh) ? hour.time : `${hh}时`
}

// 实况徽标只放等级：AQI 数值在 L 的指标格里另有一席，
// 徽标带上数字会挤掉 XL 左栏（112px）的城市名。
function airLabel(snap: WeatherSnapshot): string {
  return aqiLabel(snap.aqi)
}

function todayRange(snap: WeatherSnapshot): string {
  const today = snap.days[0]
  return today ? `${today.low}—${today.high}°` : "—"
}

// 实况块：城市 + 空气徽标 + 大温度 + 天气状态/体感。M / L / XL 共用。
function NowBlock(props: { snap: WeatherSnapshot; size: WidgetSize }) {
  const compact = () => props.size === "M"
  return (
    <div
      {...stylex.attrs(
        styles.now,
        compact() && styles.nowMedium,
        props.size === "XL" && styles.nowExtraLarge,
      )}
      data-weather-now
    >
      <div {...stylex.attrs(styles.eyebrow, compact() && styles.eyebrowStart)}>
        <span {...stylex.attrs(styles.city)}>
          {props.size === "M" || props.size === "XL"
            ? shortLocationLabel(props.snap)
            : locationLabel(props.snap)}
        </span>
        <Show when={!compact()}>
          <span {...stylex.attrs(styles.air)} data-weather-air>
            {airLabel(props.snap)}
          </span>
        </Show>
      </div>
      <div {...stylex.attrs(styles.nowLine)}>
        <strong {...stylex.attrs(styles.temp, compact() && styles.tempMedium)}>
          {props.snap.temp}°
        </strong>
        <div {...stylex.attrs(styles.copy)}>
          <strong {...stylex.attrs(styles.title)}>{weatherCodeToText(props.snap.code)}</strong>
          <span {...stylex.attrs(styles.muted)}>体感 {props.snap.feelsLike}°</span>
        </div>
      </div>
    </div>
  )
}

// 逐小时列表。M 隐藏状态文案，L / XL 带边框容器。
function HourList(props: { snap: WeatherSnapshot; size: WidgetSize }) {
  const hours = () => props.snap.hours.slice(0, HOUR_COUNT[props.size])
  const compact = () => props.size === "M"
  return (
    <div
      // 内联比较 props.size：stylex 的 babel 求值器无法解析多参 attrs 中的本地函数调用
      {...stylex.attrs(
        styles.hours,
        props.size === "M" && styles.hoursMedium,
        props.size !== "M" && styles.hoursFramed,
        props.size === "L" && styles.hoursLarge,
        props.size === "XL" && styles.hoursExtraLarge,
      )}
      data-weather-hours
      aria-label="小时天气"
    >
      <For each={hours()}>
        {(hour, index) => (
          <div
            {...stylex.attrs(
              styles.hour,
              index() === 0 && styles.hourFirst,
              compact() && styles.hourCompact,
            )}
          >
            <span {...stylex.attrs(styles.hourTime)}>{hourLabel(hour, index())}</span>
            <strong {...stylex.attrs(styles.hourTemp)}>{hour.temp}°</strong>
            <Show when={!compact()}>
              <small {...stylex.attrs(styles.hourState)}>{weatherCodeToText(hour.code)}</small>
            </Show>
          </div>
        )}
      </For>
    </div>
  )
}

// L 尺寸的四项指标：体感、湿度、风速、空气
function MetricGrid(props: { snap: WeatherSnapshot }) {
  const metrics = () => [
    { label: "体感", value: `${props.snap.feelsLike}°` },
    { label: "湿度", value: `${props.snap.humidity}%` },
    { label: "风速", value: `${props.snap.windSpeed} km/h` },
    // 列头已经是「空气」，值里只留等级，避免出现「空气 / 空气优 42」
    {
      label: "空气",
      value: props.snap.aqi === null ? "—" : `${aqiGrade(props.snap.aqi)} ${props.snap.aqi}`,
    },
  ]
  return (
    <div {...stylex.attrs(styles.metrics)} data-weather-metrics aria-label="天气指标">
      <For each={metrics()}>
        {(metric) => (
          <div {...stylex.attrs(styles.metric)}>
            <span {...stylex.attrs(styles.metricLabel)}>{metric.label}</span>
            <strong {...stylex.attrs(styles.value)}>{metric.value}</strong>
          </div>
        )}
      </For>
    </div>
  )
}

// XL 尺寸右栏：未来三天
function DailyPanel(props: { snap: WeatherSnapshot }) {
  return (
    <section {...stylex.attrs(styles.dailyPanel)} data-weather-daily aria-label="未来三天">
      <strong {...stylex.attrs(styles.dailyTitle)}>未来三天</strong>
      <For each={props.snap.days.slice(0, 3)}>
        {(day) => (
          <div {...stylex.attrs(styles.day)}>
            <span {...stylex.attrs(styles.dayLabel)}>{day.label}</span>
            <strong {...stylex.attrs(styles.dayState)}>{weatherCodeToText(day.code)}</strong>
            <em {...stylex.attrs(styles.dayRange)}>
              {day.low}—{day.high}°
            </em>
          </div>
        )}
      </For>
    </section>
  )
}

function CardBody(props: { snap: WeatherSnapshot; size: WidgetSize }) {
  return (
    <Show when={props.size !== "S"} fallback={<SmallBody snap={props.snap} />}>
      <Show when={props.size !== "M"} fallback={<MediumBody snap={props.snap} />}>
        <Show when={props.size !== "L"} fallback={<LargeBody snap={props.snap} />}>
          <ExtraLargeBody snap={props.snap} />
        </Show>
      </Show>
    </Show>
  )
}

function SmallBody(props: { snap: WeatherSnapshot }) {
  return (
    <>
      <div {...stylex.attrs(styles.smallHead)}>
        <span>天气</span>
        <span {...stylex.attrs(styles.smallLocation)}>{props.snap.city}</span>
      </div>
      <span {...stylex.attrs(styles.smallOrbit)} aria-hidden="true" />
      <strong {...stylex.attrs(styles.smallTemp)} data-weather-now>
        {props.snap.temp}°
      </strong>
      <div {...stylex.attrs(styles.smallFoot)}>
        <span>{weatherCodeToText(props.snap.code)}</span>
        <span>{todayRange(props.snap)}</span>
      </div>
    </>
  )
}

function MediumBody(props: { snap: WeatherSnapshot }) {
  return (
    <div {...stylex.attrs(styles.mediumCard)}>
      <NowBlock snap={props.snap} size="M" />
      <HourList snap={props.snap} size="M" />
    </div>
  )
}

function LargeBody(props: { snap: WeatherSnapshot }) {
  return (
    <>
      <div {...stylex.attrs(styles.hero)}>
        <NowBlock snap={props.snap} size="L" />
        <span {...stylex.attrs(styles.air)}>{todayRange(props.snap)}</span>
      </div>
      <MetricGrid snap={props.snap} />
      <HourList snap={props.snap} size="L" />
    </>
  )
}

function ExtraLargeBody(props: { snap: WeatherSnapshot }) {
  return (
    <>
      <section {...stylex.attrs(styles.summary)}>
        <NowBlock snap={props.snap} size="XL" />
        <p {...stylex.attrs(styles.note)}>
          {locationLabel(props.snap)} · {formatUpdatedAt(props.snap.updatedAt)} ·{" "}
          {windDirectionLabel(props.snap.windDirection)} {props.snap.windSpeed} km/h
        </p>
      </section>
      <section {...stylex.attrs(styles.forecastPanel)}>
        <div {...stylex.attrs(styles.forecastHead)}>
          <strong {...stylex.attrs(styles.forecastTitle)}>逐小时预报</strong>
          <span {...stylex.attrs(styles.forecastMeta)}>未来 {HOUR_COUNT.XL} 小时</span>
        </div>
        <HourList snap={props.snap} size="XL" />
      </section>
      <DailyPanel snap={props.snap} />
    </>
  )
}

export function WeatherCard(props: WidgetViewProps & { network: PluginNetworkAccess }) {
  const store = createWeatherStore(props)
  const cardSize = (): WidgetSize => props.size ?? "S"

  return (
    <div
      {...stylex.attrs(
        styles.root,
        // 直接内联比较 props.size：stylex 的 babel 求值器无法解析多参 attrs 中的本地函数调用
        (props.size ?? "S") === "S" && styles.rootSmall,
        props.size === "M" && styles.rootMedium,
        props.size === "L" && styles.rootLarge,
        props.size === "XL" && styles.rootExtraLarge,
      )}
      data-weather-card
      data-weather-variant={cardSize()}
    >
      <Show
        when={store.snapshot()}
        fallback={
          <Show
            when={!store.error()}
            fallback={
              <div {...stylex.attrs(styles.stack)} data-weather-error>
                <InlineError>{store.error()!}</InlineError>
                <Button size="sm" variant="secondary" onClick={() => void store.load()}>
                  <RefreshCw size={12} /> 重试
                </Button>
              </div>
            }
          >
            <div {...stylex.attrs(styles.stack)}>
              <Skeleton height="52px" width="100%" />
              <Skeleton height="40px" width="100%" />
            </div>
          </Show>
        }
      >
        {(snap) => <CardBody snap={snap()} size={cardSize()} />}
      </Show>
    </div>
  )
}
