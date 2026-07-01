import { createSignal, For, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { InlineError, SegmentedControl, Select, Skeleton } from "@tabora/ui"
import { RefreshCw } from "lucide-solid"
import { WeatherIcon } from "./weather-icon"
import { createWeatherStore } from "./weather-store"
import {
  aqiLabel,
  formatUpdatedAt,
  weatherCodeToText,
  windDirectionLabel,
  type WeatherSnapshot,
} from "./weather-data"

type WeatherView = "hourly" | "forecast" | "advice"

// 常用城市预设，作为 Select 快速切换项；用户仍可保存任意配置城市。
const PRESET_CITIES = ["北京", "上海", "深圳", "广州", "杭州", "成都"]

type Advice = { name: string; desc: string; tag: string }

// 依据真实数据推导生活建议
function buildAdvice(snap: WeatherSnapshot): Advice[] {
  const rain = snap.precipitation
  const aqi = snap.aqi
  const humidity = snap.humidity

  const commute: Advice =
    rain >= 50
      ? { name: "通勤", desc: "降水概率较高，建议携带雨具并预留时间。", tag: "带伞" }
      : rain >= 20
        ? { name: "通勤", desc: "可能有短时降水，出门前留意天气变化。", tag: "留意降水" }
        : { name: "通勤", desc: "降水概率低，适合步行或骑行。", tag: "低风险" }

  const drying: Advice =
    rain >= 30 || humidity >= 75
      ? { name: "晾晒", desc: "湿度偏高或有降水，不建议户外晾晒。", tag: "不推荐" }
      : { name: "晾晒", desc: "湿度适中，适合户外晾晒。", tag: "适宜" }

  const sport: Advice =
    aqi !== null && aqi > 150
      ? { name: "运动", desc: "空气质量较差，建议室内运动。", tag: "室内" }
      : rain >= 50
        ? { name: "运动", desc: "降水概率高，建议改为室内训练。", tag: "室内" }
        : { name: "运动", desc: "天气与空气质量良好，适合户外运动。", tag: "适宜" }

  return [commute, drying, sport]
}

export function WeatherExpand(props: WidgetViewProps) {
  const store = createWeatherStore(props)
  const [view, setView] = createSignal<WeatherView>("hourly")

  const cityOptions = () => {
    const current = store.city()
    const set = new Set<string>([current, ...PRESET_CITIES])
    return [...set].map((city) => ({ value: city, label: city }))
  }

  return (
    <div class="weather-expand" data-tabora-plugin-id="official.widgets.weather">
      <Show
        when={store.snapshot()}
        fallback={
          <Show
            when={!store.error()}
            fallback={
              <div class="weather-error">
                <InlineError>{store.error()!}</InlineError>
                <button class="weather-retry" type="button" onClick={() => void store.load()}>
                  <RefreshCw size={12} /> 重试
                </button>
              </div>
            }
          >
            <div class="weather-skeleton">
              <Skeleton height="88px" width="100%" />
              <Skeleton height="200px" width="100%" />
            </div>
          </Show>
        }
      >
        {(snap) => (
          <div class="weather-expand-body">
            <div class="weather-expand-main">
              <section class="now-panel" aria-label="当前天气">
                <div class="now-icon">
                  <WeatherIcon code={snap().code} size={40} />
                </div>
                <div class="now-temp">{snap().temp}°</div>
                <div class="now-copy">
                  <strong>
                    {weatherCodeToText(snap().code)} · 体感 {snap().feelsLike}°
                  </strong>
                  <span>
                    {snap().city}
                    {snap().district ? ` · ${snap().district}` : ""} ·{" "}
                    {formatUpdatedAt(snap().updatedAt)}更新
                  </span>
                </div>
                <div class="aqi">
                  <b>AQI {snap().aqi ?? "—"}</b>
                  <span>{aqiLabel(snap().aqi)}</span>
                </div>
              </section>

              <SegmentedControl
                size="sm"
                value={view()}
                onChange={(next) => setView(next as WeatherView)}
                options={[
                  { value: "hourly", label: "逐小时" },
                  { value: "forecast", label: "三日趋势" },
                  { value: "advice", label: "生活建议" },
                ]}
                aria-label="天气视图切换"
              />

              <Show when={view() === "hourly"}>
                <section class="view-panel" aria-label="逐小时天气">
                  <div class="view-head">
                    <span>未来 5 小时</span>
                    <span>温度 · 天气 · 降水</span>
                  </div>
                  <div class="weather-list">
                    <For each={snap().hours}>
                      {(hour) => (
                        <div class="weather-row">
                          <b>{hour.time}</b>
                          <span>
                            <WeatherIcon code={hour.code} size={14} />{" "}
                            {weatherCodeToText(hour.code)}
                          </span>
                          <em>
                            {hour.temp}° · 降水 {hour.precipitation}%
                          </em>
                        </div>
                      )}
                    </For>
                  </div>
                </section>
              </Show>

              <Show when={view() === "forecast"}>
                <section class="view-panel" aria-label="三日趋势">
                  <div class="view-head">
                    <span>未来三天</span>
                    <span>高低温 · 天气</span>
                  </div>
                  <div class="weather-list">
                    <For each={snap().days}>
                      {(day) => (
                        <div class="weather-row">
                          <b>{day.label}</b>
                          <span>
                            <WeatherIcon code={day.code} size={14} /> {weatherCodeToText(day.code)}
                          </span>
                          <em>
                            {day.high}° / {day.low}°
                          </em>
                        </div>
                      )}
                    </For>
                  </div>
                </section>
              </Show>

              <Show when={view() === "advice"}>
                <section class="view-panel" aria-label="生活建议">
                  <div class="view-head">
                    <span>个人提醒</span>
                    <span>通勤 · 晾晒 · 运动</span>
                  </div>
                  <div class="weather-list">
                    <For each={buildAdvice(snap())}>
                      {(advice) => (
                        <div class="advice-row">
                          <b>{advice.name}</b>
                          <span>{advice.desc}</span>
                          <em>{advice.tag}</em>
                        </div>
                      )}
                    </For>
                  </div>
                </section>
              </Show>
            </div>

            <aside class="weather-expand-side" aria-label="天气配置">
              <section class="side-panel">
                <div class="side-title">城市</div>
                <Select
                  size="sm"
                  value={store.city()}
                  onChange={(next) => void store.setCity(next)}
                  options={cityOptions()}
                  aria-label="选择城市"
                />
                <button
                  class="weather-refresh"
                  type="button"
                  onClick={() => void store.load()}
                  disabled={store.loading()}
                >
                  <RefreshCw size={13} /> {store.loading() ? "刷新中" : "刷新"}
                </button>
              </section>

              <section class="side-panel">
                <div class="side-title">关注指标</div>
                <div class="mini-grid">
                  <div class="mini-stat">
                    <b>{snap().humidity}%</b>
                    <span>湿度</span>
                  </div>
                  <div class="mini-stat">
                    <b>{snap().windSpeed}km/h</b>
                    <span>{windDirectionLabel(snap().windDirection)}</span>
                  </div>
                  <div class="mini-stat">
                    <b>{snap().precipitation}%</b>
                    <span>降水概率</span>
                  </div>
                  <div class="mini-stat">
                    <b>{snap().feelsLike}°</b>
                    <span>体感温度</span>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        )}
      </Show>
    </div>
  )
}
